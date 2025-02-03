import http from 'http'
import fetch from 'node-fetch'
import { Server } from 'socket.io'
import helmet from 'helmet'
import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session'
import { randomUUID } from 'crypto'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { morganLogger } from './config/morgan.js'
import { sessionOptions } from './config/sessionOptions.js'
import { logger } from './config/winston.js'
import { router } from './routes/router.js'
import httpContext from 'express-http-context'

try {
  const app = express()
  const directoryFullName = dirname(fileURLToPath(import.meta.url))
  const baseURL = process.env.BASE_URL || '/'

  const server = http.createServer(app)
  const io = new Server(server)

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'"],
        'img-src': ["'self'", 'https://*.gravatar.com']
      }
    })
  )

  app.set('view engine', 'ejs')
  app.set('views', join(directoryFullName, 'views'))
  app.set('layout', join(directoryFullName, 'views', 'layouts', 'default'))
  app.set('layout extractScripts', true)
  app.set('layout extractStyles', true)
  app.use(expressLayouts)
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json())
  app.use(express.static(join(directoryFullName, '..', 'public')))

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
  }
  app.use(session(sessionOptions))
  app.use(httpContext.middleware)
  app.use(morganLogger)

  app.use((req, res, next) => {
    req.requestUuid = randomUUID()
    httpContext.set('request', req)

    if (req.session.flash) {
      res.locals.flash = req.session.flash
      delete req.session.flash
    }

    res.locals.baseURL = baseURL
    res.io = io
    next()
  })

  app.use('/', router)

  // Catch-all route handler
  app.use((req, res, next) => {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
  })

  app.use((err, req, res, next) => {
    logger.error(err.message, { error: err })

    if (err.status === 404) {
      res
        .status(404)
        .sendFile(join(directoryFullName, 'views', 'errors', '404.html'))
      return
    }

    if (process.env.NODE_ENV !== 'development') {
      res
        .status(500)
        .sendFile(join(directoryFullName, 'views', 'errors', '500.html'))
      return
    }

    res
      .status(err.status || 500)
      .render('errors/error', { error: err })
  })

  io.on('connection', async (socket) => {
    console.log('New client connected')

    const gitlabToken = process.env.GITLAB_TOKEN
    const projectId = process.env.PROJECT_ID

    try {
      const response = await fetch(`https://gitlab.lnu.se/api/v4/projects/${projectId}/issues`, {
        headers: {
          'PRIVATE-TOKEN': gitlabToken
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const issues = await response.json()
      console.log(issues)
      socket.emit('issues', issues)
    } catch (error) {
      console.error('Error:', error)
    }
    // handle socket events here
    socket.on('disconnect', () => {
      console.log('socket.io: a user is disconnected')
    })
  })

  server.listen(process.env.PORT, () => {
    logger.info(`Server running at http://localhost:${server.address().port}`)
    logger.info('Press Ctrl-C to terminate...')
  })
} catch (err) {
  logger.error(err.message, { error: err })
  process.exitCode = 1
}
