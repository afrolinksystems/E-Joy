import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

/** Display status for floor map (OCCUPIED is derived from active orders). */
export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  DIRTY = 'DIRTY',
}

registerEnumType(TableStatus, { name: 'TableStatus' });

@ObjectType('Table')
export class TableModel {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  tableNumber!: string;

  @Field(() => Int)
  capacity!: number;

  @Field(() => Float)
  posX!: number;

  @Field(() => Float)
  posY!: number;

  @Field(() => TableStatus)
  status!: TableStatus;

  @Field(() => String)
  shopId!: string;
}
