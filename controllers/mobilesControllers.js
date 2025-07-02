const { PrismaClient, Brand, ItemStatus } = require('@prisma/client') // Import enums
const prisma = new PrismaClient()
const multer = require('multer')
require('dotenv').config()
const cloudinary = require('cloudinary').v2

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure multer for file upload (using memory storage)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage }).array('m02_photos', 10) // Allow multiple files, max 10

// Enum validation function
const isValidBrand = (brand) => Object.values(Brand).includes(brand)
const isValidStatus = (status) => Object.values(ItemStatus).includes(status)

// Use multer as middleware for the route
exports.createMobile = [
    upload,
    async (req, res) => {
        try {
            // Validate required fields
            if (!req.body.m02_model_name) {
                return res.status(422).json({ error: "Model name is required" })
            }
            if (!req.body.m02_purchase_price) {
                return res.status(422).json({ error: "Purchase price is required" })
            } else {
                const price = parseFloat(req.body.m02_purchase_price) // Convert to number
                if (isNaN(price) || price < 0) {
                    return res.status(422).json({ error: "Purchase price must be a non-negative number!" })
                }
            }

            // Validate enum fields
            const brand = req.body.m02_brand
            if (brand && !isValidBrand(brand)) {
                return res.status(422).json({ error: `Invalid brand value. Must be one of ${Object.values(Brand).join(', ')}` })
            }
            const status = req.body.m02_status
            if (status && !isValidStatus(status)) {
                return res.status(422).json({ error: `Invalid status value. Must be one of ${Object.values(ItemStatus).join(', ')}` })
            }

            // Upload multiple images to Cloudinary if present
            let photoUrls = null
            console.log('req.files:', req.files) // Debug log to inspect files
            if (req.files && req.files.length > 0) {
                photoUrls = await Promise.all(req.files.map(file => {
                    if (!file.buffer) {
                        throw new Error('File buffer is missing for one or more uploaded files')
                    }
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { resource_type: 'image' },
                            (error, result) => {
                                if (error) return reject(error)
                                resolve(result.secure_url)
                            }
                        )
                        uploadStream.end(file.buffer)
                    })
                }))
                console.log('Uploaded to Cloudinary:', photoUrls) // Debug log
            } else {
                console.log('No files uploaded or req.files is undefined') // Debug log
            }

            // Parse and validate dates
            let purchaseDate = null
            if (req.body.m02_purchase_date) {
                const date = new Date(req.body.m02_purchase_date)
                if (isNaN(date.getTime())) {
                    return res.status(422).json({ error: "Invalid purchase date format. Use YYYY-MM-DD" })
                }
                purchaseDate = date.toISOString() // Full ISO-8601 format
            }

            let sellingDate = null
            if (req.body.m02_selling_date) {
                const date = new Date(req.body.m02_selling_date)
                if (isNaN(date.getTime())) {
                    return res.status(422).json({ error: "Invalid selling date format. Use YYYY-MM-DD" })
                }
                sellingDate = date.toISOString()
            }

            // Prepare data for mobile creation
            const userId = req.body.m02_m01_user_id ? parseInt(req.body.m02_m01_user_id) : null
            const mobileData = {
                m02_model_name: req.body.m02_model_name,
                m02_purchase_price: parseFloat(req.body.m02_purchase_price),
                m02_selling_price: req.body.m02_selling_price ? parseFloat(req.body.m02_selling_price) : null,
                m02_brand: brand || null,
                m02_imei: req.body.m02_imei || null,
                m02_country: req.body.m02_country || null,
                m02_color: req.body.m02_color || null,
                m02_varient: req.body.m02_varient || null,
                m02_battery: req.body.m02_battery || null,
                m02_photos: photoUrls ? JSON.stringify(photoUrls) : null,
                m02_notes: req.body.m02_notes || null,
                m02_status: status || null,
                m02_care_warrenty: req.body.m02_care_warrenty || null,
                m02_purchase_date: purchaseDate,
                m02_selling_date: sellingDate,
                m02_m01_user_id: userId,
                m02_user: userId ? { connect: { m01_id: userId } } : undefined
            }

            // Create new mobile with all provided data
            const newMobile = await prisma.m02_Mobiles.create({
                data: mobileData
            })

            return res.status(200).json({
                status: "Success",
                message: "Product Created Successfully",
                data: {
                    ...newMobile,
                }
            })

        } catch (error) {
            console.error('Error during mobile creation:', error)
            return res.status(500).json({ error: error.message || 'An error occurred while creating the mobile' })
        }
    }
]

exports.listMobiles = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const skip = (pageNum - 1) * limitNum

        const searchFilter = search ? {
            OR: [
                { m02_model_name: { contains: search, mode: 'insensitive' } },
                { m02_imei: { contains: search, mode: 'insensitive' } },
                { m02_country: { contains: search, mode: 'insensitive' } },
                { m02_color: { contains: search, mode: 'insensitive' } },
                { m02_varient: { contains: search, mode: 'insensitive' } },
                { m02_brand: { contains: search, mode: 'insensitive' } },
            ].filter(condition => condition !== undefined)
        } : {}

        const [mobiles, totalCount] = await Promise.all([
            prisma.m02_Mobiles.findMany({
                where: searchFilter,
                skip: skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.m02_Mobiles.count({ where: searchFilter })
        ])

        return res.status(200).json({
            status: "Success",
            message: "Mobiles fetched successfully",
            data: {
                mobiles,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalCount / limitNum)
                }
            }
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.getSingleMobile = async (req, res) => {
    try {
        const singleMobile = await prisma.m02_Mobiles.findUnique({ where: { m02_id: parseInt(req.params.m02_id) } })
        if (!singleMobile) { return res.status(404).json({ error: 'Mobile not found!' }) }
        return res.status(200).json({
            status: "Success",
            message: "Mobile fetched successfully",
            data: singleMobile
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.deleteMobile = async (req, res) => {
    try {
        const userId = req.params.m02_id
        if (!userId) {
            return res.status(400).json({ error: "Mobile ID is required" })
        }
        const parsedId = parseInt(userId)
        if (isNaN(parsedId)) {
            return res.status(400).json({ error: "Invalid Mobile ID format" })
        }

        const mobileExists = await prisma.m02_Mobiles.findUnique({ where: { m02_id: parsedId } })
        if (!mobileExists) {
            return res.status(404).json({ error: 'Mobile not found!' })
        }

        await prisma.m02_Mobiles.delete({
            where: { m02_id: parsedId }
        })
        console.log(`Mobile with ID ${parsedId} deleted successfully`) // Debug log
        return res.status(204).send()

    } catch (error) {
        console.error('Error during mobile deletion:', error)
        return res.status(500).json({ error: error?.message })
    }
}

exports.updateMobile = [
    upload,
    async (req, res) => {
        try {
            const mobileId = req.params.m02_id
            if (!mobileId) {
                return res.status(400).json({ error: "Mobile ID is required" })
            }
            const parsedId = parseInt(mobileId)
            if (isNaN(parsedId)) {
                return res.status(400).json({ error: "Invalid Mobile ID format" })
            }

            if (!await prisma.m02_Mobiles.findUnique({ where: { m02_id: parsedId } })) {
                return res.status(404).json({ error: 'Mobile not found!' })
            }

            // Validate required fields
            if (!req.body.m02_model_name) {
                return res.status(422).json({ error: "Model name is required" })
            }
            if (!req.body.m02_purchase_price) {
                return res.status(422).json({ error: "Purchase price is required" })
            } else {
                const price = parseFloat(req.body.m02_purchase_price)
                if (isNaN(price) || price < 0) {
                    return res.status(422).json({ error: "Purchase price must be a non-negative number!" })
                }
            }

            // Validate enum fields
            const brand = req.body.m02_brand
            if (brand && !isValidBrand(brand)) {
                return res.status(422).json({ error: `Invalid brand value. Must be one of ${Object.values(Brand).join(', ')}` })
            }
            const status = req.body.m02_status
            if (status && !isValidStatus(status)) {
                return res.status(422).json({ error: `Invalid status value. Must be one of ${Object.values(ItemStatus).join(', ')}` })
            }

            // Upload multiple images to Cloudinary if present
            let photoUrls = null
            console.log('req.files:', req.files) // Debug log to inspect files
            if (req.files && req.files.length > 0) {
                photoUrls = await Promise.all(req.files.map(file => {
                    if (!file.buffer) {
                        throw new Error('File buffer is missing for one or more uploaded files')
                    }
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            { resource_type: 'image' },
                            (error, result) => {
                                if (error) return reject(error)
                                resolve(result.secure_url)
                            }
                        )
                        uploadStream.end(file.buffer)
                    })
                }))
                console.log('Uploaded to Cloudinary:', photoUrls) // Debug log
            } else {
                console.log('No files uploaded or req.files is undefined') // Debug log
            }

            // Parse and validate dates
            let purchaseDate = undefined
            if (req.body.m02_purchase_date) {
                const date = new Date(req.body.m02_purchase_date)
                if (isNaN(date.getTime())) {
                    return res.status(422).json({ error: "Invalid purchase date format. Use YYYY-MM-DD" })
                }
                purchaseDate = date.toISOString()
            }

            let sellingDate = undefined
            if (req.body.m02_selling_date) {
                const date = new Date(req.body.m02_selling_date)
                if (isNaN(date.getTime())) {
                    return res.status(422).json({ error: "Invalid selling date format. Use YYYY-MM-DD" })
                }
                sellingDate = date.toISOString()
            }

            // Prepare data for mobile update
            const userId = req.body.m02_m01_user_id ? parseInt(req.body.m02_m01_user_id) : undefined
            const mobileData = {
                m02_model_name: req.body.m02_model_name,
                m02_purchase_price: parseFloat(req.body.m02_purchase_price),
                m02_selling_price: req.body.m02_selling_price ? parseFloat(req.body.m02_selling_price) : undefined,
                m02_brand: brand,
                m02_imei: req.body.m02_imei,
                m02_country: req.body.m02_country,
                m02_color: req.body.m02_color,
                m02_varient: req.body.m02_varient,
                m02_battery: req.body.m02_battery,
                m02_photos: photoUrls ? JSON.stringify(photoUrls) : undefined,
                m02_notes: req.body.m02_notes,
                m02_status: status,
                m02_care_warrenty: req.body.m02_care_warrenty,
                m02_purchase_date: purchaseDate,
                m02_selling_date: sellingDate,
                m02_m01_user_id: userId,
                m02_user: userId ? { connect: { m01_id: userId } } : undefined
            }

            // Update mobile with all provided data, filtering out undefined values
            const updatedMobile = await prisma.m02_Mobiles.update({
                data: Object.fromEntries(
                    Object.entries(mobileData).filter(([_, value]) => value !== undefined)
                ),
                where: { m02_id: parsedId }
            })

            return res.status(200).json({
                status: "Success",
                message: "Mobile updated successfully!",
                data: {
                    ...updatedMobile
                }
            })

        } catch (error) {
            console.error('Error during mobile update:', error)
            return res.status(500).json({ error: error.message })
        }
    }
]