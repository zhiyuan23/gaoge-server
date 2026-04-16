import { Buffer } from 'node:buffer'
import * as crypto from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface WechatSession {
  openid: string;
  session_key: string;
  unionid?: string;
}

export interface WechatPhoneInfo {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: string;
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name)
  private readonly appId: string
  private readonly appSecret: string
  private readonly baseUrl = 'https://api.weixin.qq.com'

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('WECHAT_APPID') || ''
    this.appSecret = this.configService.get<string>('WECHAT_APPSECRET') || ''

    if (!this.appId || !this.appSecret) {
      throw new Error('微信小程序配置缺失，请检查 WECHAT_APPID 和 WECHAT_APPSECRET')
    }
  }

  /**
   * 通过 code 获取用户 openid 和 session_key
   */
  async getSessionByCode(code: string): Promise<WechatSession> {
    try {
      const url = new URL(`${this.baseUrl}/sns/jscode2session`)
      url.searchParams.append('appid', this.appId)
      url.searchParams.append('secret', this.appSecret)
      url.searchParams.append('js_code', code)
      url.searchParams.append('grant_type', 'authorization_code')

      this.logger.debug('请求微信登录', { url: url.toString(), params: { appid: this.appId, js_code: code, secret: '***' } })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.errcode) {
        throw new Error(`微信登录失败: ${data.errmsg} (${data.errcode})`)
      }

      this.logger.debug('微信登录成功', { openid: data.openid })

      return {
        openid: data.openid,
        session_key: data.session_key,
        unionid: data.unionid,
      }
    }
    catch (error: any) {
      this.logger.error('微信登录失败', { code, error: error.message })
      throw new Error(`微信登录失败: ${error.message}`)
    }
  }

  /**
   * 解密用户手机号信息
   */
  decryptPhoneInfo(
    encryptedData: string,
    sessionKey: string,
    iv: string,
  ): WechatPhoneInfo {
    try {
      const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(sessionKey, 'base64'), Buffer.from(iv, 'base64'))
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8')
      decrypted += decipher.final('utf8')

      const phoneInfo = JSON.parse(decrypted) as WechatPhoneInfo

      if (!phoneInfo.phoneNumber || !phoneInfo.purePhoneNumber) {
        throw new Error('解密后的手机号信息不完整')
      }

      return phoneInfo
    }
    catch (error: any) {
      this.logger.error('手机号解密失败', { error: error.message })
      throw new Error(`手机号解密失败: ${error.message}`)
    }
  }

  /**
   * 检查签名是否有效
   */
  checkSignature(data: string, session_key: string, signature: string): boolean {
    const rawData = data + session_key
    const hash = crypto.createHash('sha1').update(rawData, 'utf8').digest('hex')
    return hash === signature
  }
}
