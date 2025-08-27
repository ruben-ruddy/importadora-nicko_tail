// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module'; // <-- ¡NUEVO!
import { ClientsModule } from './clients/clients.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { DmsModule } from './dms/dms.module';
import { PublicProductsModule } from './public-products/public-products.module';
import { PublicCategoriesModule } from './public-categories/public-categories.module';
import { RolesModule } from './roles/roles.module';
import { ForecastModule } from './forecast/forecast.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    UsersModule,
    ClientsModule,
    SalesModule,
    PurchasesModule,
    InventoryMovementsModule,
    DmsModule,
    PublicProductsModule,
    PublicCategoriesModule,
    RolesModule,
    ForecastModule, // <-- ¡Añade UsersModule aquí!
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}