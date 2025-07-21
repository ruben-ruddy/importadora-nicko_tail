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
    DmsModule, // <-- ¡Añade UsersModule aquí!
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}