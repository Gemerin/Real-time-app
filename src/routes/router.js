import express from 'express'
import http from 'http'
import { router as homeRouter } from './homeRouter.js'
import { router as taskRouter } from './IssueRouter.js'
import { router as webhookRouter } from './webhooksRouter.js'

/**
 * Main router for the application.
 */
export const router = express.Router()

router.use('/', homeRouter)
router.use('/tasks', taskRouter)
router.use('/webhooks', webhookRouter)

/**
 * Middleware to catch 404 errors.
 * Always keep this as the last route.
 *
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @param {express.NextFunction} next - Express next function.
 */
router.use('*', (req, res, next) => {
  const statusCode = 404
  const error = new Error(http.STATUS_CODES[statusCode])
  error.status = statusCode
  next(error)
})
