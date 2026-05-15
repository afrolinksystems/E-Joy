import { BottomTabs } from './components/BottomTabs'
import { CheckoutCartDrawer } from './components/CheckoutCartDrawer'
import { HomeScreen } from './components/HomeScreen'
import { ItemDetailDrawer } from './components/ItemDetailDrawer'
import { MenuScreen } from './components/MenuScreen'
import { MissingQrScreen } from './components/MissingQrScreen'
import { OrdersScreen } from './components/OrdersScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { ShopInfoDrawer } from './components/ShopInfoDrawer'
import { useCustomerOrderingApp } from './hooks/useCustomerOrderingApp'

export function CustomerOrderingPage() {
  const state = useCustomerOrderingApp()

  if (!state.hasTableSession) {
    return <MissingQrScreen />
  }

  return (
    <main
      className="min-h-svh bg-background text-foreground"
      data-theme={state.customerThemePreset}
      style={state.customerThemeVars}
    >
      <div className="relative mx-auto min-h-svh w-full max-w-[480px] overflow-hidden bg-background">
        {state.activeTab === 'home' ? (
          <HomeScreen shopName={state.shopName} onStart={() => state.setActiveTab('menu')} />
        ) : null}

        {state.activeTab === 'menu' ? (
          <MenuScreen
            cart={state.cart}
            categories={state.categories}
            error={state.error?.message}
            loading={state.loading}
            menuRows={state.menuRows}
            onAdd={(item) => {
              state.addItem({ id: item.id, name: item.name, price: item.unitPrice })
            }}
            onOpenCart={() => state.setCartOpen(true)}
            onOpenDetail={state.setDetailItem}
            onOpenInfo={() => state.setShopInfoOpen(true)}
            onRefetch={() => void state.refetch()}
            search={state.search}
            selectedCategory={state.selectedCategory}
            setSearch={state.setSearch}
            setSelectedCategory={state.setSelectedCategory}
            shopName={state.shopName}
            tableRef={state.tableRef}
            totalPrice={state.totalPrice}
            totalQuantity={state.totalQuantity}
            visibleRows={state.visibleRows}
          />
        ) : null}

        {state.activeTab === 'orders' ? (
          <OrdersScreen
            loading={state.ordersLoading}
            orders={state.orders}
            onGoOrder={() => state.setActiveTab('menu')}
            onOpenOrder={(id) => state.navigate(`/orders/${id}`)}
            onRefresh={() => void state.refetchOrders()}
          />
        ) : null}

        {state.activeTab === 'profile' ? (
          <ProfileScreen
            shopId={state.shopId}
            tableRef={state.tableRef}
            onClearSession={() => {
              state.clearCart()
              state.clearSession()
              window.location.reload()
            }}
            onGoOrders={() => state.setActiveTab('orders')}
          />
        ) : null}

        <BottomTabs
          activeTab={state.activeTab}
          onSelect={state.setActiveTab}
          totalQuantity={state.totalQuantity}
        />
      </div>

      <ItemDetailDrawer
        item={state.detailItem}
        onOpenChange={(open) => {
          if (!open) state.setDetailItem(null)
        }}
        onAdd={(quantity, remark) => {
          if (!state.detailItem) return
          state.addItem({
            id: state.detailItem.id,
            name: state.detailItem.name,
            price: state.detailItem.unitPrice,
            quantity,
            remark,
          })
          state.setDetailItem(null)
        }}
      />

      <CheckoutCartDrawer
        cart={state.cart}
        checkoutLoading={state.checkoutLoading}
        deleteItem={state.deleteItem}
        incrementItem={state.incrementItem}
        lastOrder={state.lastOrder}
        note={state.orderNote}
        onClear={state.clearCart}
        open={state.cartOpen}
        onOpenChange={state.setCartOpen}
        onPay={state.payWithTelebirr}
        removeItem={state.removeItem}
        setNote={state.setOrderNote}
        totalPrice={state.totalPrice}
        totalQuantity={state.totalQuantity}
      />

      <ShopInfoDrawer
        open={state.shopInfoOpen}
        shopName={state.shopName}
        tableRef={state.tableRef}
        onOpenChange={state.setShopInfoOpen}
      />
    </main>
  )
}
