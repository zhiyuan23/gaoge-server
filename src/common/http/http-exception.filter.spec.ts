import { BadRequestException } from '@nestjs/common'
import { HttpExceptionFilter } from './http-exception.filter'

describe('httpExceptionFilter', () => {
  it('maps validation messages into the common envelope', () => {
    const filter = new HttpExceptionFilter()
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
      }),
    }

    filter.catch(new BadRequestException(['openid must be a string']), host as any)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      code: 400,
      data: null,
      errMsg: 'openid must be a string',
    })
  })
})
