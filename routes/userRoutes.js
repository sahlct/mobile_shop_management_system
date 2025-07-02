const router = require('express').Router()
const userController = require('../controllers/userControllers')

router.post('/', userController.createUser)
router.get('/', userController.getUsers )
router.get('/:m01_id', userController.getSingleUser)
router.put('/:m01_id', userController.updateUser)
router.delete('/:m01_id', userController.deleteUser)

module.exports =  router