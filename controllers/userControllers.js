const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const multer = require('multer')
require('dotenv').config() // Load .env variables
const cloudinary = require('cloudinary').v2

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer for file upload (using memory storage)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Use multer as middleware for the route
exports.createUser = [
    upload.single('m01_profile_photo'),
    async (req, res) => {
        try {
            // Validate required fields
            if (!req.body.m01_name || !req.body.m01_contact_number) {
                return res.status(422).json({
                    error: "Name and contact number are required"
                })
            }

            // Check if contact number already exists
            const existingUser = await prisma.m01_user.findFirst({
                where: { m01_contact_number: parseInt(req.body.m01_contact_number) }
            })
            if (existingUser) {
                return res.status(409).json({
                    error: `Contact number ${req.body.m01_contact_number} is already in use!`
                })
            }

            // Upload image to Cloudinary if present
            let imageUrl = null
            if (req.file) {
                const uploadPromise = () => new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { resource_type: 'image' },
                        (error, result) => {
                            if (error) return reject(error)
                            resolve(result)
                        }
                    )
                    uploadStream.end(req.file.buffer)
                })
                const uploadResult = await uploadPromise()
                imageUrl = uploadResult.secure_url
                // console.log('Uploaded to Cloudinary:', imageUrl) // Debug log
            } else {
                console.log('No file uploaded') // Debug log
            }

            // Prepare data for user creation
            const userData = {
                m01_name: req.body.m01_name,
                m01_contact_number: parseInt(req.body.m01_contact_number),
                m01_email: req.body.m01_email || null,
                m01_place: req.body.m01_place || null,
                m01_profile_photo: imageUrl,
            }

            // Create new user with all provided data
            const newUser = await prisma.m01_user.create({
                data: userData
            })

            // Convert BigInt to string for JSON response
            const responseData = {
                ...newUser,
                m01_contact_number: newUser.m01_contact_number.toString()
            }

            return res.status(201).json({
                status: "Success",
                message: "New User Created Successfully!",
                data: responseData
            })

        } catch (error) {
            console.error('Error during user creation:', error) // Debug log
            return res.status(500).json({
                error: error.message || 'An error occurred while creating the user'
            })
        }
    }
]

exports.getUsers = async (req, res) => {
    try {
        // Extract query parameters
        const { page = 1, limit = 10, search = '' } = req.query
        
        // Convert page and limit to numbers
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const skip = (pageNum - 1) * limitNum

        // Build search filter
        const searchFilter = search ? {
            OR: [
                { m01_name: { contains: search, mode: 'insensitive' } },
                { m01_email: { contains: search, mode: 'insensitive' } },
                { m01_place: { contains: search, mode: 'insensitive' } },
                {
                    m01_contact_number: {
                        equals: isNaN(parseInt(search)) ? undefined : parseInt(search)
                    }
                }
            ].filter(condition => condition !== undefined)
        } : {}

        // Fetch users with pagination and search
        const [users, totalCount] = await Promise.all([
            prisma.m01_user.findMany({
                where: searchFilter,
                skip: skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.m01_user.count({ where: searchFilter })
        ])

        // Convert BigInt to string for JSON response
        const formattedUsers = users.map(user => ({
            ...user,
            m01_contact_number: user.m01_contact_number.toString()
        }))

        return res.status(200).json({
            status: "Success",
            message: "Users data fetched successfully",
            data: {
                users: formattedUsers,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            }
        })

    } catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
}

exports.updateUser = [
    upload.single('m01_profile_photo'), // Add multer middleware for file upload
    async (req, res) => {
        try {
            // Check if user exists
            const userId = parseInt(req.params.m01_id)
            if (!await prisma.m01_user.findUnique({ where: { m01_id: userId } })) {
                return res.status(404).json({ error: "User Not Found!" })
            }

            // Validate required fields
            if (!req.body.m01_name || !req.body.m01_contact_number) {
                return res.status(422).json({
                    error: "Name and contact number are required"
                })
            }

            // Check if contact number is already used by another user
            const existingUser = await prisma.m01_user.findFirst({
                where: {
                    m01_contact_number: parseInt(req.body.m01_contact_number),
                    m01_id: { not: userId } // Exclude current user
                }
            })
            if (existingUser) {
                return res.status(409).json({
                    error: `Contact number ${req.body.m01_contact_number} is already in use!`
                })
            }

            // Upload image to Cloudinary if present
            let imageUrl = null
            if (req.file) {
                const uploadPromise = () => new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { resource_type: 'image' },
                        (error, result) => {
                            if (error) return reject(error)
                            resolve(result)
                        }
                    )
                    uploadStream.end(req.file.buffer)
                })
                const uploadResult = await uploadPromise()
                imageUrl = uploadResult.secure_url
                // console.log('Uploaded to Cloudinary:', imageUrl) // Debug log
            } else {
                console.log('No file uploaded') // Debug log
            }

            // Prepare data for user update
            const userData = {
                m01_name: req.body.m01_name,
                m01_contact_number: parseInt(req.body.m01_contact_number),
                m01_email: req.body.m01_email || null,
                m01_place: req.body.m01_place || null,
                m01_profile_photo: imageUrl,
            }

            // Update user with all provided data
            const updatedUser = await prisma.m01_user.update({
                where: { m01_id: userId },
                data: userData
            })

            // Convert BigInt to string for JSON response
            const responseData = {
                ...updatedUser,
                m01_contact_number: updatedUser.m01_contact_number.toString()
            }

            return res.status(200).json({
                status: "Success",
                message: "User updated successfully!",
                data: responseData
            })

        } catch (error) {
            console.error('Error during user update:', error) // Debug log
            return res.status(500).json({
                error: error.message || 'An error occurred while updating the user'
            })
        }
    }
]

exports.deleteUser = async (req, res) => {
    try {
        if (!await prisma.m01_user.findUnique({ where: { m01_id: parseInt(req.params.m01_id) } })) {
            return res.status(404).json({ error: "User Not Found!" })
        }

        await prisma.m01_user.delete({
            where: {
                m01_id: parseInt(req.params.m01_id)
            }
        })
        return res.status(204).send()

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}

exports.getSingleUser = async (req, res) => {
    try {
        const currentUser = await prisma.m01_user.findUnique({
            where: {
                m01_id: parseInt(req.params.m01_id)
            }
        })

        if (!currentUser) {
            return res.status(404).json({ error: "User Not Found!" })
        }

        // Convert BigInt to string for JSON response
        const responseData = {
            ...currentUser,
            m01_contact_number: currentUser.m01_contact_number.toString()
        }

        return res.status(200).json({
            status: "Success",
            message: "User fetched successfully",
            data: responseData
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}