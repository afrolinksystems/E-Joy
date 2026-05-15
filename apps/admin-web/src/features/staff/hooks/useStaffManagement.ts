import { useMutation, useQuery } from '@apollo/client/react'
import { useCallback, useState } from 'react'
import {
  CREATE_STAFF_ACCOUNT,
  DELETE_STAFF_USER,
  GET_STAFF_LIST,
  UPDATE_STAFF_ROLE,
  type GetStaffListData,
  type StaffRole,
  type StaffUserRow,
} from '../../../graphql/staff'
import { useAdminSession } from '../../../lib/adminSession'
import { useStaffForm } from './useStaffForm'

export function useStaffManagement() {
  const { shopId } = useAdminSession()
  const addForm = useStaffForm()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<StaffUserRow | null>(null)
  const [editRole, setEditRole] = useState<StaffRole>('WAITER')

  const { data, loading, error, refetch } = useQuery<GetStaffListData>(
    GET_STAFF_LIST,
    {
      variables: { shopId },
      fetchPolicy: 'network-only',
    },
  )

  const [createStaff, { loading: creating }] = useMutation(
    CREATE_STAFF_ACCOUNT,
    {
      onCompleted: () => {
        void refetch()
        setAddOpen(false)
        addForm.resetForm()
      },
    },
  )

  const [updateRole, { loading: updating }] = useMutation(UPDATE_STAFF_ROLE, {
    onCompleted: () => {
      void refetch()
      setEditRow(null)
    },
  })

  const [deleteStaff, { loading: deleteLoading }] = useMutation(
    DELETE_STAFF_USER,
    {
      onCompleted: () => void refetch(),
    },
  )

  const openAdd = useCallback(() => {
    addForm.resetForm()
    setAddOpen(true)
  }, [addForm])

  const openEdit = useCallback((row: StaffUserRow) => {
    setEditRow(row)
    setEditRole(row.role)
  }, [])

  const submitAdd = useCallback(async () => {
    const name = addForm.form.name.trim()
    const phone = addForm.form.phone.trim()
    const password = addForm.form.password
    if (!name || !phone || !password) {
      window.alert('Please fill in name, phone, and initial password.')
      return
    }
    await createStaff({
      variables: {
        input: {
          name,
          phone,
          password,
          role: addForm.form.role,
        },
      },
    })
  }, [addForm.form, createStaff])

  const submitEditRole = useCallback(async () => {
    if (!editRow) return
    await updateRole({
      variables: {
        input: { userId: editRow.id, newRole: editRole },
      },
    })
  }, [editRole, editRow, updateRole])

  const onDelete = useCallback(
    (row: StaffUserRow) => {
      const ok = window.confirm(
        `Remove staff access for ${row.name} (${row.phone})? They will be marked inactive.`,
      )
      if (!ok) return
      void deleteStaff({ variables: { userId: row.id } })
    },
    [deleteStaff],
  )

  return {
    addForm,
    addOpen,
    creating,
    deleteLoading,
    editRole,
    editRow,
    error,
    loading,
    onDelete,
    openAdd,
    openEdit,
    rows: data?.getStaffList ?? [],
    setAddOpen,
    setEditRole,
    setEditRow,
    shopId,
    submitAdd,
    submitEditRole,
    updating,
  }
}

