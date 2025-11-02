// src/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

// Mock data
const mockCategory = {
  id_categoria: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  nombre_categoria: 'Electrónicos',
};

const mockProduct = {
  id_producto: 'product-uuid-1234',
  id_categoria: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  nombre_producto: 'Smartphone X',
  codigo_producto: 'SMART-X-001',
  descripcion: 'Smartphone de última generación',
  precio_venta: 799.99,
  precio_compra: 600.00,
  stock_actual: 150,
  stock_minimo: 10,
  imagen_url: '/uploads/image123.jpg',
  activo: true,
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date(),
  category: mockCategory,
};

// DTOs for creating and updating products
const mockCreateProductDto: CreateProductDto = {
  id_categoria: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  nombre_producto: 'Smartphone X',
  codigo_producto: 'SMART-X-001',
  descripcion: 'Smartphone de última generación',
  precio_venta: 799.99,
  precio_compra: 600.00,
  stock_actual: 150,
  stock_minimo: 10,
  imagen_url: '/uploads/image123.jpg',
  activo: true,
};

const mockUpdateProductDto: UpdateProductDto = {
  nombre_producto: 'Smartphone X Pro',
  precio_venta: 899.99,
};
// Begin test suite
describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    category: {
      findUnique: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
// Setup the testing module
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      // Act
      const result = await service.create(mockCreateProductDto);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id_categoria: mockCreateProductDto.id_categoria },
      });
      expect(mockPrismaService.product.findFirst).toHaveBeenCalled();
      
      
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          id_categoria: mockCreateProductDto.id_categoria,
          nombre_producto: mockCreateProductDto.nombre_producto,
          codigo_producto: mockCreateProductDto.codigo_producto || '',
          descripcion: mockCreateProductDto.descripcion,
          precio_venta: mockCreateProductDto.precio_venta,
          precio_compra: mockCreateProductDto.precio_compra,
          stock_actual: mockCreateProductDto.stock_actual,
          imagen_url: mockCreateProductDto.imagen_url,
          activo: mockCreateProductDto.activo,
        },
      });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        `La categoría con ID "${mockCreateProductDto.id_categoria}" no existe.`,
      );
    });

    it('should throw ConflictException when product name already exists', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);

      // Act & Assert
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        `El producto con nombre "${mockCreateProductDto.nombre_producto}" ya existe.`,
      );
    });

    it('should throw ConflictException when product code already exists', async () => {
      // Arrange
      const existingProduct = { ...mockProduct, nombre_producto: 'Different Name' };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(existingProduct);

      // Act & Assert
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(mockCreateProductDto)).rejects.toThrow(
        `El producto con código "${mockCreateProductDto.codigo_producto}" ya existe.`,
      );
    });

    it('should handle empty codigo_producto correctly', async () => {
      // Arrange
      const createDtoWithoutCode = { ...mockCreateProductDto, codigo_producto: undefined };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      // Act
      await service.create(createDtoWithoutCode);

      // Assert
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          id_categoria: createDtoWithoutCode.id_categoria,
          nombre_producto: createDtoWithoutCode.nombre_producto,
          codigo_producto: '',
          descripcion: createDtoWithoutCode.descripcion,
          precio_venta: createDtoWithoutCode.precio_venta,
          precio_compra: createDtoWithoutCode.precio_compra,
          stock_actual: createDtoWithoutCode.stock_actual,
          imagen_url: createDtoWithoutCode.imagen_url,
          activo: createDtoWithoutCode.activo,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated products with default values', async () => {
      // Arrange
      const query: ProductQueryDto = {};
      const mockProducts = [mockProduct];
      const mockTotal = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockProducts, mockTotal]);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual({
        products: mockProducts,
        total: mockTotal,
        page: 1,
        limit: 10,
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {},
        include: { category: true },
        skip: 0,
        take: 10,
        orderBy: { nombre_producto: 'asc' },
      });
    });

    it('should apply search filter correctly', async () => {
      // Arrange
      const query: ProductQueryDto = { search: 'Smartphone' };
      const mockProducts = [mockProduct];
      const mockTotal = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockProducts, mockTotal]);

      // Act
      await service.findAll(query);

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { nombre_producto: { contains: 'Smartphone', mode: 'insensitive' } },
            { descripcion: { contains: 'Smartphone', mode: 'insensitive' } },
            { codigo_producto: { contains: 'Smartphone', mode: 'insensitive' } },
          ],
        },
        include: { category: true },
        skip: 0,
        take: 10,
        orderBy: { nombre_producto: 'asc' },
      });
    });

    it('should apply category filter correctly', async () => {
      // Arrange
      const query: ProductQueryDto = { categoryId: mockCategory.id_categoria };
      const mockProducts = [mockProduct];
      const mockTotal = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockProducts, mockTotal]);

      // Act
      await service.findAll(query);

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          id_categoria: mockCategory.id_categoria,
        },
        include: { category: true },
        skip: 0,
        take: 10,
        orderBy: { nombre_producto: 'asc' },
      });
    });

    it('should apply active filter correctly', async () => {
      // Arrange
      const query: ProductQueryDto = { active: 'true' };
      const mockProducts = [mockProduct];
      const mockTotal = 1;

      mockPrismaService.$transaction.mockResolvedValue([mockProducts, mockTotal]);

      // Act
      await service.findAll(query);

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          activo: true,
        },
        include: { category: true },
        skip: 0,
        take: 10,
        orderBy: { nombre_producto: 'asc' },
      });
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const query: ProductQueryDto = { page: '2', limit: '5' };
      const mockProducts = [mockProduct];
      const mockTotal = 10;

      mockPrismaService.$transaction.mockResolvedValue([mockProducts, mockTotal]);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual({
        products: mockProducts,
        total: mockTotal,
        page: 2,
        limit: 5,
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {},
        include: { category: true },
        skip: 5,
        take: 5,
        orderBy: { nombre_producto: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      // Act
      const result = await service.findOne(mockProduct.id_producto);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id_producto: mockProduct.id_producto },
        include: { category: true },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Producto con ID "non-existent-id" no encontrado.',
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...mockUpdateProductDto,
      });

      // Act
      const result = await service.update(mockProduct.id_producto, mockUpdateProductDto);

      // Assert
      expect(result).toEqual({
        ...mockProduct,
        ...mockUpdateProductDto,
      });
      expect(mockPrismaService.product.update).toHaveBeenCalled();
    });

  it('should check for duplicate names when updating product name', async () => {
    // Arrange
    const existingProduct = { 
      ...mockProduct, 
      id_producto: 'different-id',
      nombre_producto: 'Existing Name' 
    };
    
    mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
    // Simulamos que existe un producto con el mismo nombre pero diferente ID
    mockPrismaService.product.findFirst.mockResolvedValue(existingProduct);
    // NO mockeamos el update porque la excepción se lanza antes

    // Act & Assert
    await expect(
      service.update(mockProduct.id_producto, { nombre_producto: 'Existing Name' }),
    ).rejects.toThrow(ConflictException);
    
    await expect(
      service.update(mockProduct.id_producto, { nombre_producto: 'Existing Name' }),
    ).rejects.toThrow('El producto con nombre "Existing Name" ya existe.');

    // Verificamos que se llamó a findFirst con los parámetros correctos
    expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id_producto: { not: mockProduct.id_producto } },
          {
            OR: [
              { nombre_producto: 'Existing Name' },
            ]
          }
        ]
      }
    });

    // Verificamos que NO se llamó al update porque se lanzó la excepción antes
    expect(mockPrismaService.product.update).not.toHaveBeenCalled();
  });

  // También deberíamos probar el caso de código duplicado
  it('should check for duplicate codes when updating product code', async () => {
    // Arrange
    const existingProduct = { 
      ...mockProduct, 
      id_producto: 'different-id',
      codigo_producto: 'EXISTING-CODE' 
    };
    
    mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
    mockPrismaService.product.findFirst.mockResolvedValue(existingProduct);

    // Act & Assert
    await expect(
      service.update(mockProduct.id_producto, { codigo_producto: 'EXISTING-CODE' }),
    ).rejects.toThrow(ConflictException);
    
    await expect(
      service.update(mockProduct.id_producto, { codigo_producto: 'EXISTING-CODE' }),
    ).rejects.toThrow('El producto con código "EXISTING-CODE" ya existe.');

    // Verificamos que se llamó a findFirst con los parámetros correctos
    expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id_producto: { not: mockProduct.id_producto } },
          {
            OR: [
              { codigo_producto: 'EXISTING-CODE' },
            ]
          }
        ]
      }
    });

    expect(mockPrismaService.product.update).not.toHaveBeenCalled();
  });


    it('should handle partial updates correctly', async () => {
      // Arrange
      const partialUpdate: UpdateProductDto = { precio_venta: 999.99 };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        ...partialUpdate,
      });

      // Act
      await service.update(mockProduct.id_producto, partialUpdate);

      // Assert
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id_producto: mockProduct.id_producto },
        data: {
          precio_venta: 999.99,
        },
      });
    });

    it('should throw NotFoundException when product to update not found', async () => {
      // Arrange
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.update.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('non-existent-id', mockUpdateProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    // NUEVA PRUEBA: Verificar que stock_minimo se actualiza correctamente
    it('should update stock_minimo when provided', async () => {
      // Arrange
      const updateWithStockMinimo: UpdateProductDto = { stock_minimo: 20 };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findFirst.mockResolvedValue(null);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        stock_minimo: 20,
      });

      // Act
      await service.update(mockProduct.id_producto, updateWithStockMinimo);

      // Assert
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id_producto: mockProduct.id_producto },
        data: {
          stock_minimo: 20,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      // Act
      const result = await service.remove(mockProduct.id_producto);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id_producto: mockProduct.id_producto },
      });
    });

    it('should throw NotFoundException when product to delete not found', async () => {
      // Arrange
      mockPrismaService.product.delete.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findLatestProductImages', () => {
    it('should return latest product images for carousel', async () => {
      // Arrange
      const mockLatestProducts = [
        {
          imagen_url: '/uploads/image1.jpg',
          nombre_producto: 'Product 1',
          descripcion: 'Description 1',
        },
        {
          imagen_url: '/uploads/image2.jpg',
          nombre_producto: 'Product 2',
          descripcion: 'Description 2',
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(mockLatestProducts);

      // Act
      const result = await service.findLatestProductImages();

      // Assert
      expect(result).toEqual([
        {
          imagen_url: '/uploads/image1.jpg',
          nombre_producto: 'Product 1',
          descripcion: 'Description 1',
        },
        {
          imagen_url: '/uploads/image2.jpg',
          nombre_producto: 'Product 2',
          descripcion: 'Description 2',
        },
      ]);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        orderBy: { fecha_creacion: 'desc' },
        take: 10,
        select: {
          imagen_url: true,
          nombre_producto: true,
          descripcion: true,
        },
        where: {
          activo: true,
          NOT: { imagen_url: null },
        },
      });
    });

    it('should handle database errors in findLatestProductImages', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockRejectedValue(new Error('DB Error'));

      // Act & Assert
      await expect(service.findLatestProductImages()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAllPublicProducts', () => {
    it('should return all public products with complete image URLs', async () => {
      // Arrange
      const mockProducts = [
        {
          ...mockProduct,
          imagen_url: '/uploads/image123.jpg',
          category: mockCategory,
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      // Act
      const result = await service.findAllPublicProducts();

      // Assert
      expect(result).toEqual([
        {
          category: 'Electrónicos',
          imagen_url: 'http://localhost:3000/uploads/image123.jpg',
          nombre_producto: 'Smartphone X',
          descripcion: 'Smartphone de última generación',
          price: 799.99,
        },
      ]);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        include: {
          category: {
            select: { nombre_categoria: true },
          },
        },
        orderBy: { fecha_creacion: 'desc' },
      });
    });

    it('should filter public products by category when categoryId provided', async () => {
      // Arrange
      const mockProducts = [{ ...mockProduct }];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      // Act
      await service.findAllPublicProducts(mockCategory.id_categoria);

      // Assert
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          activo: true,
          id_categoria: mockCategory.id_categoria,
        },
        include: {
          category: {
            select: { nombre_categoria: true },
          },
        },
        orderBy: { fecha_creacion: 'desc' },
      });
    });

    it('should handle products without images correctly', async () => {
      // Arrange
      const productWithoutImage = {
        ...mockProduct,
        imagen_url: null,
        category: mockCategory,
      };
      mockPrismaService.product.findMany.mockResolvedValue([productWithoutImage]);

      // Act
      const result = await service.findAllPublicProducts();

      // Assert
      expect(result[0].imagen_url).toBeNull();
    });

    it('should handle database errors in findAllPublicProducts', async () => {
      // Arrange
      mockPrismaService.product.findMany.mockRejectedValue(new Error('DB Error'));

      // Act & Assert
      await expect(service.findAllPublicProducts()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findPublicProductById', () => {
    it('should return public product by ID with complete image URL', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        category: mockCategory,
      });

      // Act
      const result = await service.findPublicProductById(mockProduct.id_producto);

      // Assert
      expect(result).toEqual({
        id: mockProduct.id_producto,
        name: mockProduct.nombre_producto,
        category: 'Electrónicos',
        price: 799.99,
        stock: 150,
        description: 'Smartphone de última generación',
        imageUrl: 'http://localhost:3000/uploads/image123.jpg',
      });
    });

    it('should throw NotFoundException when product not found or inactive', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findPublicProductById('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors in findPublicProductById', async () => {
      // Arrange
      mockPrismaService.product.findUnique.mockRejectedValue(new Error('DB Error'));

      // Act & Assert
      await expect(
        service.findPublicProductById(mockProduct.id_producto),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle products without images correctly', async () => {
      // Arrange
      const productWithoutImage = {
        ...mockProduct,
        imagen_url: null,
        category: mockCategory,
      };
      mockPrismaService.product.findUnique.mockResolvedValue(productWithoutImage);

      // Act
      const result = await service.findPublicProductById(mockProduct.id_producto);

      // Assert
      expect(result.imageUrl).toBeNull();
    });
  });
});