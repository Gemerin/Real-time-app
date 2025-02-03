import express from 'express'
import { IssueController } from '../controllers/IssueController.js'

/**
 * Router for snippet-related routes.
 */
export const router = express.Router()

const controller = new IssueController()

/**
 * Route for getting all tasks.
 */
router.get('/', (req, res, next) => controller.index(req, res, next))
