import { logger } from '../config/winston.js'
import fetch from 'node-fetch'

/**
 * Encapsulates a controller.
 */
export class WebhooksController {
  /**
   * Receives a webhook, and creates a new task.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async indexPost (req, res) {
    try {
      // Acknowledge the webhook by responding quickly!
      res.status(200).send('Webhook received')

      const payload = req.body

      logger.silly('webhook (recived)', { payload })

      // Only process the webhook if the event type is 'issue'; ignore other event types.
      if (payload.event_type !== 'issue') {
        logger.silly('webhook (invalid event)', { event_type: payload.event_type })
        return
      }

      // Take care of the received payload.
      await this.#processPayload(payload, res.io)
    } catch (error) {
      // Log the error but nothing more (a response has already been sent)!
      logger.error(error.message, { error })
    }
  }

  /**
   * Verifies the webhook.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  verifyToken (req, res, next) {
    try {
      // Use the GitLab secret token to validate the received payload.
      if (req.headers['x-gitlab-token'] !== process.env.WEBHOOK_SECRET) {
        logger.info('webhook (invalid token)', {
          'x-gitlab-token': req.headers['x-gitlab-token']
        })
        res.status(401).send('Invalid token')
        return
      }
      next()
    } catch (error) {
      logger.error(error.message, { error })
      next(error)
    }
  }

  /**
   * Processes the received webhook payload.
   *
   * @param {object} payload - The received payload.
   * @param {import('socket.io').Server} io - The socket server.
   * @private
   */
  async #processPayload (payload, io) {
    const action = payload.object_attributes.action
    let eventType

    switch (action) {
      case 'open':
        eventType = 'issues/open'
        break
      case 'reopen':
        eventType = 'issues/reopen'
        break
      case 'close':
        eventType = 'issues/close'
        break
      case 'update':
        eventType = 'issues/update'
        break
      default:
        return
    }

    const data = {
      type: eventType,
      data: payload
    }
    io.sockets.emit(eventType, data)
  }

  /**
   * Closes an issue.
   *
   * @param {number} taskIid - The internal ID of the task.
   * @param {number} projectId - The ID of the project that the task belongs to.
   * @throws {Error} If the request to close the issue fails.
   */
  async closeIssue (taskIid, projectId) {
    const gitlabToken = process.env.GITLAB_TOKEN
    try {
      const response = await fetch(`https://gitlab.lnu.se/api/v4/projects/${projectId}/issues/${taskIid}`, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state_event: 'close' })
      })
      if (!response.ok) {
        const responseBody = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`)
      }
    } catch (error) {
      console.error(`Failed to close issue: ${error}`)
      throw error
    }
  }

  /**
   * Reopens an issue.
   *
   * @param {number} taskIid - The internal ID of the task.
   * @param {number} projectId - The ID of the project that the task belongs to.
   * @throws {Error} If the request to reopen the issue fails.
   */
  async reopenIssue (taskIid, projectId) {
    const gitlabToken = process.env.GITLAB_TOKEN
    try {
      const response = await fetch(`https://gitlab.lnu.se/api/v4/projects/${projectId}/issues/${taskIid}`, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state_event: 'reopen' })
      })
      if (!response.ok) {
        const responseBody = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`)
      }
    } catch (error) {
      console.error(`Failed to close issue: ${error}`)
      throw error
    }
  }

  /**
   * Returns the project ID.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   */
  async getProjectId (req, res) {
    try {
      const projectId = process.env.PROJECT_ID
      res.send({ projectId })
    } catch (error) {
      logger.error(error.message, { error })
      res.status(500).send('An error has occured.')
    }
  }
}
