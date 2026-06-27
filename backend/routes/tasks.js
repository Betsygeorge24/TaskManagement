const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const router = express.Router();

const isTaskEditableByUser = (task, userId) => {
  const currentUserId = userId?.toString();
  return (
    task.createdBy?.toString() === currentUserId ||
    task.assignedTo?.toString() === currentUserId
  );
};

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch tasks' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, status, assignedTo, dueDate } = req.body;
  try {
    const task = await Task.create({
      title,
      description,
      status,
      assignedTo,
      dueDate,
      createdBy: req.user._id
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create task', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!isTaskEditableByUser(task, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, status, assignedTo, dueDate } = req.body;
    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.assignedTo = assignedTo || task.assignedTo;
    task.dueDate = dueDate || task.dueDate;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update task', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!isTaskEditableByUser(task, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete task', error: error.message });
  }
});

module.exports = router;
module.exports.isTaskEditableByUser = isTaskEditableByUser;
