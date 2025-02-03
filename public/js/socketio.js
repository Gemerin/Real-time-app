import '../socket.io/socket.io.js'
const base = document.querySelector('base')
const path = base ? (new URL('socket.io', base.href)).pathname : 'socket.io'
const socket = window.io.connect('/', { path })

document.addEventListener('DOMContentLoaded', (event) => {
  const taskTemplate = document.querySelector('#task-template')

  // If taskTemplate is not present on the page, write an error message.
  console.assert(taskTemplate, 'Could not find "#task-template" template element.')

  // ----------------------------------------------------------------------------//

  socket.on('issues/open', (data) => {
    console.log('Received issues/open event with data:', data)
    const task = data.data
    task.iid = task.object_attributes.iid
    insertOrUpdateTaskRow(task, 'issues/open')
  })

  socket.on('issues/reopen', (data) => {
    const task = data.data
    task.iid = task.object_attributes.iid
    insertOrUpdateTaskRow(task, 'issues/reopen')
  })

  socket.on('issues/close', (data) => {
    console.log(data)
    const task = data.data
    task.iid = task.object_attributes.iid
    insertOrUpdateTaskRow(task, 'issues/close')
  })

  socket.on('issues/update', (data) => {
    const task = data.data
    task.iid = task.object_attributes.iid
    insertOrUpdateTaskRow(task, 'issues/update')
  })

  socket.on('issues', (data) => {
    data.forEach(task => {
      task.id = task.iid
      insertOrUpdateTaskRow(task, 'issues')
      if (task.state === 'closed') {
        const taskNode = document.querySelector(`[data-id="${task.iid}"]`)
        const doneCheck = taskNode.querySelector('input[type=checkbox]')
        const avatarImg = taskNode.querySelector('.avatar')
        const titleCell = taskNode.querySelector('td:nth-child(3)')
        const descriptionCell = taskNode.querySelector('td:nth-child(4)')
        if (task.state === 'closed') {
          doneCheck.setAttribute('checked', '')
          descriptionCell.classList.add('text-muted')
          titleCell.classList.add('text-muted')
          avatarImg.classList.add('text-muted')
        } else {
          doneCheck.removeAttribute('checked')
          descriptionCell.classList.remove('text-muted')
          titleCell.classList.remove('text-muted')
          avatarImg.classList.remove('text-muted')
        }
      }
    })
  })

  // ----------------------------------------------------------------------------//

  /**
   * Inserts or updates a task row in the task list.
   *
   * @param {object} task - The task data.
   * @param {string} eventType - The type of the event that triggered the update.
   */
  function insertOrUpdateTaskRow (task, eventType) {
    const taskList = document.querySelector('#task-list')
    let taskNode = taskList.querySelector(`[data-id="${task.iid}"]`)

    // If the task doesn't exist in the list, create a new row.
    if (!taskNode) {
      taskNode = taskTemplate.content.cloneNode(true).querySelector('tr')
      taskNode.setAttribute('data-id', task.iid)
      taskList.appendChild(taskNode)
    }

    // Update the task row with the task data.
    updateTaskRow(taskNode, task, eventType)
  }

  /**
   * Updates a task row with the given task data.
   *
   * @param {HTMLElement} taskNode - The DOM node of the task row.
   * @param {object} task - The task data.
   * @param {string} eventType - The type of the event that triggered the update.
   */
  function updateTaskRow (taskNode, task, eventType) {
    const avatarImg = taskNode.querySelector('.avatar')
    const doneCheck = taskNode.querySelector('input[type=checkbox]')
    const titleCell = taskNode.querySelector('td:nth-child(3)')
    const descriptionCell = taskNode.querySelector('td:nth-child(4)')

    let isProgrammaticChange = false
    doneCheck.addEventListener('change', async function () {
      if (isProgrammaticChange) {
        return
      }
      fetch('./webhooks/projectId')
        .then(response => response.json())
        .then(data => {
          const projectId = data.projectId
          if (this.checked) {
            return closeIssue(task.iid, projectId)
          } else {
            return reopenIssue(task.iid, projectId)
          }
        })
    })
    isProgrammaticChange = false

    if (eventType === 'issues/close' && task.object_attributes.action === 'close') {
      isProgrammaticChange = true
      doneCheck.setAttribute('checked', '')
      isProgrammaticChange = false
      descriptionCell.classList.add('text-muted')
      titleCell.classList.add('text-muted')
      avatarImg.classList.add('text-muted')
    } else {
      isProgrammaticChange = false
      doneCheck.removeAttribute('checked')
      isProgrammaticChange = false

      descriptionCell.classList.remove('text-muted')
      titleCell.classList.remove('text-muted')
      avatarImg.classList.remove('text-muted')
    }

    if (eventType === 'issues/open' || eventType === 'issues/update') {
      avatarImg.src = task.user.avatar_url
      titleCell.textContent = task.object_attributes.title
      descriptionCell.textContent = task.object_attributes.description
    } else if (eventType === 'issues') {
      avatarImg.src = task.author.avatar_url
      titleCell.textContent = task.title
      descriptionCell.textContent = task.description
    } else if (eventType === 'issues/reopen') {
      titleCell.textContent = task.object_attributes.title
      descriptionCell.textContent = task.object_attributes.description
    }

    avatarImg.width = 40
    avatarImg.height = 40
  }

  /**
   * Closes an issue.
   *
   * @param {number} taskIid - The internal ID of the task.
   * @param {number} projectId - The ID of the project that the task belongs to.
   * @returns {Promise} A promise that resolves when the issue is closed.
   * @throws {Error} If the request to close the issue fails.
   */
  async function closeIssue (taskIid, projectId) {
    const response = await fetch(`./webhooks/${taskIid}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectId })
    })
    if (!response.ok) {
      throw new Error(`Failed to close issue: ${response.statusText}`)
    }
  }

  /**
   * Reopens an issue.
   *
   * @param {number} taskIid - The internal ID of the task.
   * @param {number} projectId - The ID of the project that the task belongs to.
   * @returns {Promise} A promise that resolves when the issue is reopened.
   * @throws {Error} If the request to reopen the issue fails.
   */
  async function reopenIssue (taskIid, projectId) {
    try {
      const response = await fetch(`./webhooks/${taskIid}/reopen`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId })
      })
      if (!response.ok) {
        throw new Error(`Failed to close issue: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Failed to reopen issue. ${error.message}`)
    }
  }
})
