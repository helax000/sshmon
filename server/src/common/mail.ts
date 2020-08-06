import * as mailer from 'nodemailer'
import * as smtpTransport from 'nodemailer-smtp-transport'
import * as util from 'util'
import * as async from 'async'
import {createLogger} from '../log'

const logger = createLogger(__filename)

// 邮箱配置
const config = {
  name: 'sshmon',
  mail_opts: {
    service: 'qq',
    host: 'smtp.qq.com',// 此为qq smtp 邮件配置
    port: 587,
    auth: {
      user: 'xxxxxxxxx@qq.com',// 发件人邮件地址
      pass: 'xxxxxxxxxxxxxxxx'// 发件人smtp邮件配置
    },
    secureConnection: true
  },

  receiver: 'xxxxxxxxx@qq.com',// 收件人邮件地址

  debug: true // 为false则发送邮件通知，否则不发
}
const transporter = mailer.createTransport(smtpTransport(config.mail_opts))

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
const sendMail = function (data: Object) {
  if (config.debug) {
    return
  }

  // 邮件发送失败重试5次, 每次间隔2秒
  async.retry({times: 5, interval: 2000}, function (done: any) {
    transporter.sendMail(data, function (err: any) {
      if (err) {
        // 写为日志
        logger.error('send mail error', err, data)
        return done(err)
      }
      return done()
    })
  }, function (err: any) {
    if (err) {
      return logger.error('send mail finally error', err, data)
    }
    logger.info('send mail success', data)
  })
}

/**
 * 发送连接vps失败通知邮件
 * @param {String} name vpsId
 */
export const sendNotifyMail = function (name: string) {
  const from = util.format('%s <%s>', config.name, config.mail_opts.auth.user)
  const subject = config.name + ' vps连接通知'
  const html = '<p>vps机器：' + name + '</p>' +
    '<p>vps[ ' + name + ' ]连接失败</p>'

  sendMail({
    from: from,
    to: config.receiver,
    subject: subject,
    html: html
  })
}
