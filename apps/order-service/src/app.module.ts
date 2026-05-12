import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderResolver } from './order/order.resolver';
import { OrderService } from './order/order.service';
import { InventoryService } from './order/inventory.service';
import { PrismaService } from './prisma/prisma.service';
import { PRISMA_CLIENT } from './prisma/prisma.token';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { JwtStrategy } from './auth/jwt.strategy';
import { PAYMENT_PROVIDER } from './payment/payment-provider.interface';
import { TelebirrPaymentProviderService } from './payment/payment-provider.service';
import { PAYMENT_EVENT_PRODUCER } from './payment/payment-event-producer.interface';
import { NoopPaymentEventProducerService } from './payment/payment-event-producer.service';
import { StaffResolver } from './staff/staff.resolver';
import { StaffService } from './staff/staff.service';
import { AdminResolver } from './admin/admin.resolver';
import { AdminService } from './admin/admin.service';
import { PaymentMetricsService } from './payment/payment-metrics.service';
import { OpsResolver } from './ops/ops.resolver';
import { OpsService } from './ops/ops.service';
import { ObservabilityService } from './ops/observability.service';
import { RealtimeService } from './realtime/realtime.service';
import { ProductResolver } from './product/product.resolver';
import { ProductService } from './product/product.service';
import { ShopResolver } from './shop/shop.resolver';
import { TableResolver } from './table/table.resolver';
import { TableService } from './table/table.service';
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import { PaymentController } from './payment/payment.controller';
import { TelebirrService } from './payment/telebirr.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev_jwt_secret',
      signOptions: { expiresIn: '1h' },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Stable path regardless of monorepo vs package cwd (turbo runs with cwd = apps/order-service).
      autoSchemaFile: join(__dirname, 'schema.gql'),
      sortSchema: true,
      subscriptions: {
        'graphql-ws': {
          // graphql-ws Context; attach headers so JwtAuthGuard sees demo / JWT on subscriptions.

          onConnect: (ctx: any) => {
            const raw =
              (ctx.connectionParams?.['Authorization'] as string | undefined) ??
              (ctx.connectionParams?.['authorization'] as string | undefined) ??
              '';
            const extra = ctx.extra ?? {};
            ctx.extra = extra;
            extra.req = {
              headers: {
                authorization: raw,
                Authorization: raw,
              },
            };
            return true;
          },
        },
      },
      context: ({
        req,
        extra,
      }: {
        req?: unknown;
        extra?: { req?: unknown };
      }) => ({ req: extra?.req ?? req }),
    }),
  ],
  controllers: [AppController, UploadController, PaymentController],
  providers: [
    { provide: 'PUB_SUB', useValue: new PubSub() },
    AppService,
    PrismaService,
    { provide: PRISMA_CLIENT, useExisting: PrismaService },
    JwtAuthGuard,
    RolesGuard,
    JwtStrategy,
    TelebirrPaymentProviderService,
    TelebirrService,
    { provide: PAYMENT_PROVIDER, useExisting: TelebirrPaymentProviderService },
    NoopPaymentEventProducerService,
    PaymentMetricsService,
    {
      provide: PAYMENT_EVENT_PRODUCER,
      useExisting: NoopPaymentEventProducerService,
    },
    OrderResolver,
    OrderService,
    InventoryService,
    ProductResolver,
    ProductService,
    ShopResolver,
    TableResolver,
    TableService,
    StaffResolver,
    StaffService,
    AdminResolver,
    AdminService,
    OpsResolver,
    OpsService,
    ObservabilityService,
    RealtimeService,
    UploadService,
  ],
})
export class AppModule {}
