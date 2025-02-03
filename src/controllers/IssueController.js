/**
 * Encapsulates a controller.
 */

/**
 *
 */
export class IssueController {
  /**
   * Displays a list of all tasks/issues.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async index (req, res, next) {
    try {
      const viewData = { task: [] }
      res.render('tasks/index', { viewData })
    } catch (error) {
      error.status = 404
      next(error)
    }
  }
}
