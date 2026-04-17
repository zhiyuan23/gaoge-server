import type { INestApplication } from '@nestjs/common'
import type { TestingModule } from '@nestjs/testing'
import type { App } from 'supertest/types'
import { Test } from '@nestjs/testing'
import { ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { HttpExceptionFilter } from './../src/common/http/http-exception.filter'
import { ResponseInterceptor } from './../src/common/http/response.interceptor'
import { AppModule } from './../src/app.module'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }))
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect({
        code: 0,
        data: 'Hello World!',
        errMsg: '',
      })
  })
})
