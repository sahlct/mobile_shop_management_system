const { PrismaClient, AccessoryType, ItemStatus } = require('@prisma/client')
const prisma = new PrismaClient()

// Enum validation functions
const isValidAccessoryType = (type) => Object.values(AccessoryType).includes(type)
const isValidItemStatus = (status) => Object.values(ItemStatus).includes(status)

exports.createAccessory = async (req, res) => {
    try {
        // Validate required fields
        const { m03_name, m03_type, m03_selling_price, m03_stock_count, m03_status } = req.body
        if (!m03_name) {
            return res.status(422).json({ error: "Accessory name is required" })
        }
        if (!m03_type) {
            return res.status(422).json({ error: "Accessory type is required" })
        }
        if (!m03_selling_price) {
            return res.status(422).json({ error: "Selling price is required" })
        }
        if (!m03_stock_count) {
            return res.status(422).json({ error: "Stock count is required" })
        }

        // Validate enum fields
        if (!isValidAccessoryType(m03_type)) {
            return res.status(422).json({ error: `Invalid accessory type. Must be one of ${Object.values(AccessoryType).join(', ')}` })
        }
        if (m03_status && !isValidItemStatus(m03_status)) {
            return res.status(422).json({ error: `Invalid status value. Must be one of ${Object.values(ItemStatus).join(', ')}` })
        }

        // Check if name is already used
        const existingAccessory = await prisma.m03_accessories.findFirst({ where: { m03_name } })
        if (existingAccessory) {
            return res.status(409).json({ error: "Accessory name is already in use" })
        }

        // Validate numeric fields
        const sellingPrice = parseFloat(m03_selling_price)
        if (isNaN(sellingPrice) || sellingPrice < 0) {
            return res.status(422).json({ error: "Selling price must be a non-negative number" })
        }
        const stockCount = parseInt(m03_stock_count)
        if (isNaN(stockCount) || stockCount < 0) {
            return res.status(422).json({ error: "Stock count must be a non-negative number" })
        }

        // Create accessory
        const accessory = await prisma.m03_accessories.create({
            data: {
                m03_name,
                m03_brand: req.body.m03_brand || null,
                m03_type,
                m03_purchase_price: req.body.m03_purchase_price ? parseFloat(req.body.m03_purchase_price) : null,
                m03_selling_price: sellingPrice,
                m03_description: req.body.m03_description || null,
                m03_stock_count: stockCount,
                m03_sold_count: req.body.m03_sold_count ? parseInt(req.body.m03_sold_count) : 0,
                m03_status: m03_status || "IN_STOCK"
            }
        })

        return res.status(201).json({
            status: "Success",
            message: "Accessory created successfully",
            data: accessory
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.getAccessories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const skip = (pageNum - 1) * limitNum

        const searchFilter = search ? {
            OR: [
                { m03_name: { contains: search, mode: 'insensitive' } },
                { m03_brand: { contains: search, mode: 'insensitive' } },
                { m03_type: { contains: search, mode: 'insensitive' } },
                { m03_description: { contains: search, mode: 'insensitive' } }
            ].filter(condition => condition !== undefined)
        } : {}

        const [accessories, totalCount] = await Promise.all([
            prisma.m03_accessories.findMany({
                where: searchFilter,
                skip: skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.m03_accessories.count({ where: searchFilter })
        ])

        return res.status(200).json({
            status: "Success",
            message: "Accessories fetched successfully",
            data: {
                accessories,
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

exports.getSingleAccessory = async (req, res) => {
    try {
        const m03_id = parseInt(req.params.m03_id)
        if (isNaN(m03_id)) {
            return res.status(400).json({ error: "Invalid Accessory ID format" })
        }

        const accessory = await prisma.m03_accessories.findUnique({ where: { m03_id } })
        if (!accessory) {
            return res.status(404).json({ error: 'Accessory not found!' })
        }

        return res.status(200).json({
            status: "Success",
            message: "Accessory fetched successfully",
            data: accessory
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.updateAccessory = async (req, res) => {
    try {
        const m03_id = parseInt(req.params.m03_id)
        if (isNaN(m03_id)) {
            return res.status(400).json({ error: "Invalid Accessory ID format" })
        }

        // Check if accessory exists
        const existingAccessory = await prisma.m03_accessories.findUnique({ where: { m03_id } })
        if (!existingAccessory) {
            return res.status(404).json({ error: 'Accessory not found!' })
        }

        // Validate required fields
        const { m03_name, m03_type, m03_selling_price, m03_stock_count, m03_status } = req.body
        if (!m03_name) {
            return res.status(422).json({ error: "Accessory name is required" })
        }
        if (!m03_type) {
            return res.status(422).json({ error: "Accessory type is required" })
        }
        if (!m03_selling_price) {
            return res.status(422).json({ error: "Selling price is required" })
        }
        if (m03_stock_count === undefined || m03_stock_count === null) {
            return res.status(422).json({ error: "Stock count is required" })
        }

        // Validate enum fields
        if (!isValidAccessoryType(m03_type)) {
            return res.status(422).json({ error: `Invalid accessory type. Must be one of ${Object.values(AccessoryType).join(', ')}` })
        }
        if (m03_status && !isValidItemStatus(m03_status)) {
            return res.status(422).json({ error: `Invalid status value. Must be one of ${Object.values(ItemStatus).join(', ')}` })
        }

        // Check if name is already used by another accessory
        const nameConflict = await prisma.m03_accessories.findFirst({ where: { m03_name } })
        if (nameConflict && nameConflict.m03_id !== m03_id) {
            return res.status(409).json({ error: "Accessory name is already in use" })
        }

        // Validate numeric fields
        const sellingPrice = parseFloat(m03_selling_price)
        if (isNaN(sellingPrice) || sellingPrice < 0) {
            return res.status(422).json({ error: "Selling price must be a non-negative number" })
        }
        const stockCount = parseInt(m03_stock_count)
        if (isNaN(stockCount) || stockCount < 0) {
            return res.status(422).json({ error: "Stock count must be a non-negative number" })
        }

        // Prepare data for update
        const accessoryData = {
            m03_name,
            m03_brand: req.body.m03_brand || undefined,
            m03_type,
            m03_purchase_price: req.body.m03_purchase_price ? parseFloat(req.body.m03_purchase_price) : undefined,
            m03_selling_price: sellingPrice,
            m03_description: req.body.m03_description || undefined,
            m03_stock_count: stockCount,
            m03_sold_count: req.body.m03_sold_count ? parseInt(req.body.m03_sold_count) : undefined,
            m03_status: m03_status || undefined
        }

        // Update accessory
        const updatedAccessory = await prisma.m03_accessories.update({
            where: { m03_id },
            data: Object.fromEntries(
                Object.entries(accessoryData).filter(([_, value]) => value !== undefined)
            )
        })

        return res.status(200).json({
            status: "Success",
            message: "Accessory updated successfully",
            data: updatedAccessory
        })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

exports.deleteAccessory = async (req, res) => {
    try {
        const m03_id = parseInt(req.params.m03_id)
        if (isNaN(m03_id)) {
            return res.status(400).json({ error: "Invalid Accessory ID format" })
        }

        const accessory = await prisma.m03_accessories.findUnique({ where: { m03_id } })
        if (!accessory) {
            return res.status(404).json({ error: 'Accessory not found!' })
        }

        await prisma.m03_accessories.delete({
            where: { m03_id }
        })

        return res.status(204).send() // No content on successful deletion
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}