import express from 'express'
import { WebhooksController } from '../controllers/webhooksController.js'

export const router = express.Router()

const controller = new WebhooksController()

/**
 * Route handling for webhook events.
 */

// Map HTTP verbs and route paths to controller actions.
router.post('/',

  /**
   * Middleware to verify the token.
   *
   * @param {express.Request} req - Express request object.
   * @param {express.Response} res - Express response object.
   * @param {express.NextFunction} next - Express next middleware function.
   * @returns {Promise<void>} A Promise that resolves when the token is verified.
   */
  (req, res, next) => controller.verifyToken(req, res, next),

  /**
   * Controller action for POST requests to the index route.
   *
   * @param {express.Request} req - Express request object.
   * @param {express.Response} res - Express response object.
   * @param {express.NextFunction} next - Express next middleware function.
   * @returns {Promise<void>} A Promise that resolves when the action is completed.
   */
  (req, res, next) => controller.indexPost(req, res, next)
)

/**
 * Route to close an issue.
 */
router.put('/:taskIid/close', async (req, res) => {
  const taskIid = req.params.taskIid
  const { projectId } = req.body
  try {
    await controller.closeIssue(taskIid, projectId)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send({ error: error.toString() })
  }
})

/**
 * Route to reopen an issue.
 */
router.put('/:taskIid/reopen', async (req, res) => {
  const taskIid = req.params.taskIid
  const { projectId } = req.body
  try {
    await controller.reopenIssue(taskIid, projectId)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send({ error: error.toString() })
  }
})

/**
 * Route to get the project ID.
 */
router.get('/projectId', controller.getProjectId)
