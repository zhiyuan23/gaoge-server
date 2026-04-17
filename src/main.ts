import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { HttpExceptionFilter } from './common/http/http-exception.filter'
import { ResponseInterceptor } from './common/http/response.interceptor'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 启用 CORS（跨域资源共享）
  app.enableCors({
    origin: [
      'http://localhost:9000', // Admin 开发
      'http://127.0.0.1:9000', // Admin 开发
      'http://localhost:9527', // H5 开发
      'http://127.0.0.1:9527', // H5 开发
      'https://gaoge.cc', // 生产域名
      'https://www.gaoge.cc',
      'https://api.gaoge.cc',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Token'],
  })

  // Swagger 接口文档配置
  const config = new DocumentBuilder()
    .setTitle('高歌服务端 API 文档')
    .setDescription('高歌项目后端接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/api') // 自动带上全局API前缀
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api-docs', app, document)

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
