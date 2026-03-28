1. Bootstrap Setup in main.ts
This is where you configure the spec metadata:
tsimport { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Printo API')
  .setDescription('Cloud print-on-demand platform API')
  .setVersion('1.0')
  .addBearerAuth(          // ← JWT auth scheme
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',        // ← reference name used in @ApiBearerAuth()
  )
  .addTag('auth', 'Authentication endpoints')
  .addTag('files', 'File upload and processing')
  .addTag('orders', 'Print orders')
  .addServer('https://api.printobd.com', 'Production')
  .addServer('http://localhost:3000', 'Local Dev')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);

2. DTO Decoration — The Core of Your Spec
Every DTO field should be annotated. Use @ApiProperty() for required, @ApiPropertyOptional() for optional:
tsimport { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'File ID from R2 storage', example: 'file_abc123' })
  fileId: string;

  @ApiProperty({ enum: ['color', 'bw'], description: 'Print color mode' })
  colorMode: 'color' | 'bw';

  @ApiProperty({ minimum: 1, maximum: 500, example: 10 })
  copies: number;

  @ApiPropertyOptional({ example: '1-5,8,11-13', description: 'Page range syntax' })
  pageRange?: string;

  @ApiProperty({ enum: ['simplex', 'duplex'] })
  sides: string;
}
Key @ApiProperty options to always set:

description — what this field means
example — critical for Scalar/Swagger UI to show realistic values
required — defaults to true, set false for optional
enum — for union/enum types
minimum/maximum — for numbers
type + isArray: true — for arrays


3. Controller Decoration
Decorate every controller and route:
tsimport {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiQuery
} from '@nestjs/swagger';

@ApiTags('orders')          // groups routes in the UI
@ApiBearerAuth('access-token')  // marks all routes as JWT-protected
@Controller('orders')
export class OrdersController {

  @Post()
  @ApiOperation({ summary: 'Create a new print order' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateOrderDto) {}

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Order UUID', example: 'ord_xyz789' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {}

  @Get()
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  findAll() {}
}

4. Response DTOs — Document What You Return
Don't just document inputs. Create explicit response DTOs:
tsexport class OrderResponseDto {
  @ApiProperty({ example: 'ord_xyz789' })
  id: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ example: 150.00, description: 'Total price in BDT' })
  totalPrice: number;

  @ApiProperty({ type: () => FileResponseDto })  // ← lazy ref for circular deps
  file: FileResponseDto;

  @ApiProperty()
  createdAt: Date;
}
Then reference it in @ApiResponse({ type: OrderResponseDto }) on your controller.

5. Enums
Define enums properly so the spec shows a dropdown in the UI:
tsexport enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  COMPLETED = 'completed',
}

// In DTO:
@ApiProperty({ enum: OrderStatus, enumName: 'OrderStatus' })
status: OrderStatus;
The enumName makes it a named $ref in the spec instead of an inline array — keeps the spec clean.

6. Nested Objects & Arrays
ts// Nested object
@ApiProperty({ type: () => AddressDto })
shippingAddress: AddressDto;

// Array of primitives
@ApiProperty({ type: [String], example: ['A4', 'A3'] })
supportedSizes: string[];

// Array of objects
@ApiProperty({ type: () => [OrderItemDto] })
items: OrderItemDto[];
Always use lazy refs (type: () => Foo) for nested types to avoid circular dependency issues.

7. File Uploads
ts@Post('upload')
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
      printType: { type: 'string', enum: ['document', 'photo'] },
    },
  },
})
@UseInterceptors(FileInterceptor('file'))
upload(@UploadedFile() file: Express.Multer.File) {}

8. Global Error Response DTOs
Define a reusable error shape and reference it everywhere:
tsexport class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

// In controllers:
@ApiResponse({ status: 400, type: ApiErrorDto })
