const express = require('express');
const Item = require('../models/Item');
const { validateMobile } = require('../services/mobileValidation');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await Item.find().populate('category', 'name').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, mobileNumber, categoryId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!mobileNumber || !mobileNumber.trim()) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    let mobileDetails = null;

    if (mobileNumber && mobileNumber.trim()) {
      let validation;
      try {
        validation = await validateMobile(mobileNumber.trim());
      } catch {
        return res.status(503).json({ error: 'Mobile validation service unavailable' });
      }
      if (!validation.valid) {
        return res.status(400).json({ error: 'Invalid mobile number' });
      }
      mobileDetails = {
        countryCode: validation.countryCode,
        countryName: validation.countryName,
        operatorName: validation.operatorName,
      };
    }

    const item = await Item.create({
      name: name.trim(),
      description: description.trim(),
      mobileNumber: mobileNumber ? mobileNumber.trim() : null,
      mobileDetails,
      category: categoryId || null,
    });

    await item.populate('category', 'name');
    res.status(201).json(item);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, mobileNumber, categoryId } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (categoryId !== undefined) updates.category = categoryId || null;

    if (mobileNumber !== undefined) {
      if (mobileNumber === null || mobileNumber === '') {
        updates.mobileNumber = null;
        updates.mobileDetails = null;
      } else {
        let validation;
        try {
          validation = await validateMobile(mobileNumber.trim());
        } catch {
          return res.status(503).json({ error: 'Mobile validation service unavailable' });
        }
        if (!validation.valid) {
          return res.status(400).json({ error: 'Invalid mobile number' });
        }
        updates.mobileNumber = mobileNumber.trim();
        updates.mobileDetails = {
          countryCode: validation.countryCode,
          countryName: validation.countryName,
          operatorName: validation.operatorName,
        };
      }
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('category', 'name');

    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
