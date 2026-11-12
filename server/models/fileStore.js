const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { dataDir } = require('../config/db');

class FileModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(dataDir, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  _readAll() {
    try {
      if (!fs.existsSync(this.filePath)) return [];
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content || '[]');
    } catch (e) {
      console.error(`Error reading ${this.collectionName}:`, e);
      return [];
    }
  }

  _writeAll(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing ${this.collectionName}:`, e);
    }
  }

  _matchFilter(item, filter = {}) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(val)) {
        const matchesAny = val.some(subFilter => this._matchFilter(item, subFilter));
        if (!matchesAny) return false;
        continue;
      }
      if (val && typeof val === 'object' && val.$in) {
        if (!val.$in.map(String).includes(String(item[key]))) return false;
        continue;
      }
      if (val && typeof val === 'object' && val.$ne !== undefined) {
        if (String(item[key]) === String(val.$ne)) return false;
        continue;
      }
      if (String(item[key]) !== String(val)) {
        return false;
      }
    }
    return true;
  }

  find(filter = {}) {
    const all = this._readAll();
    let results = all.filter(item => this._matchFilter(item, filter));
    return new QueryBuilder(results, this);
  }

  findOne(filter = {}) {
    const all = this._readAll();
    const item = all.find(doc => this._matchFilter(doc, filter)) || null;
    return new SingleDocQueryBuilder(item, this);
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const all = this._readAll();
    const newDoc = {
      _id: (data._id || crypto.randomBytes(12).toString('hex')),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    all.push(newDoc);
    this._writeAll(all);
    return new DocWrapper(newDoc, this);
  }

  async insertMany(items) {
    const all = this._readAll();
    const created = [];
    for (const item of items) {
      const doc = {
        _id: (item._id || crypto.randomBytes(12).toString('hex')),
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      all.push(doc);
      created.push(new DocWrapper(doc, this));
    }
    this._writeAll(all);
    return created;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const all = this._readAll();
    const idx = all.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return null;

    let updatedDoc = { ...all[idx] };
    if (update.$set) {
      Object.assign(updatedDoc, update.$set);
    } else {
      Object.assign(updatedDoc, update);
    }
    updatedDoc.updatedAt = new Date().toISOString();
    all[idx] = updatedDoc;
    this._writeAll(all);
    return new DocWrapper(updatedDoc, this);
  }

  async findByIdAndDelete(id) {
    const all = this._readAll();
    const idx = all.findIndex(d => String(d._id) === String(id));
    if (idx === -1) return null;
    const deleted = all.splice(idx, 1)[0];
    this._writeAll(all);
    return new DocWrapper(deleted, this);
  }

  async deleteOne(filter) {
    const all = this._readAll();
    const idx = all.findIndex(d => this._matchFilter(d, filter));
    if (idx === -1) return { deletedCount: 0 };
    all.splice(idx, 1);
    this._writeAll(all);
    return { deletedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const all = this._readAll();
    const remaining = all.filter(d => !this._matchFilter(d, filter));
    const deletedCount = all.length - remaining.length;
    this._writeAll(remaining);
    return { deletedCount };
  }

  async countDocuments(filter = {}) {
    const all = this._readAll();
    return all.filter(d => this._matchFilter(d, filter)).length;
  }
}

class DocWrapper {
  constructor(doc, model) {
    Object.assign(this, doc);
    this._raw = doc;
    this._model = model;
  }

  async save() {
    if (this._model) {
      const all = this._model._readAll();
      const idx = all.findIndex(d => String(d._id) === String(this._id));
      const cleanData = { ...this };
      delete cleanData._raw;
      delete cleanData._model;
      if (idx !== -1) {
        all[idx] = cleanData;
      } else {
        all.push(cleanData);
      }
      this._model._writeAll(all);
    }
    return this;
  }

  toObject() {
    const clean = { ...this };
    delete clean._raw;
    delete clean._model;
    return clean;
  }

  toJSON() {
    return this.toObject();
  }
}

class QueryBuilder {
  constructor(items, model) {
    this.items = items.map(i => new DocWrapper(i, model));
    this.model = model;
  }

  sort(sortObj) {
    if (!sortObj) return this;
    const [key, dir] = Object.entries(sortObj)[0] || [];
    if (key) {
      const direction = dir === -1 || dir === 'desc' ? -1 : 1;
      this.items.sort((a, b) => {
        if (a[key] < b[key]) return -1 * direction;
        if (a[key] > b[key]) return 1 * direction;
        return 0;
      });
    }
    return this;
  }

  limit(num) {
    if (num && typeof num === 'number') {
      this.items = this.items.slice(0, num);
    }
    return this;
  }

  select(fieldsStr) {
    if (!fieldsStr) return this;
    const fields = fieldsStr.split(' ').filter(Boolean);
    const exclude = fields.filter(f => f.startsWith('-')).map(f => f.slice(1));
    if (exclude.length > 0) {
      this.items = this.items.map(item => {
        const copy = { ...item };
        exclude.forEach(f => delete copy[f]);
        return new DocWrapper(copy, this.model);
      });
    }
    return this;
  }

  populate(field, selectFields) {
    // Populate simple foreign key references
    try {
      const refMap = {
        studentId: 'users',
        createdBy: 'users',
        examId: 'exams',
        submissionId: 'submissions',
      };
      const targetCollection = refMap[field];
      if (targetCollection) {
        const targetModel = new FileModel(targetCollection);
        const allTargets = targetModel._readAll();
        this.items = this.items.map(item => {
          const targetId = item[field];
          if (targetId) {
            let matched = allTargets.find(t => String(t._id) === String(targetId && targetId._id ? targetId._id : targetId));
            if (matched) {
              if (selectFields) {
                const keep = selectFields.split(' ').filter(Boolean);
                const projected = {};
                keep.forEach(k => { projected[k] = matched[k]; });
                projected._id = matched._id;
                matched = projected;
              }
              item[field] = matched;
            }
          }
          return item;
        });
      }
    } catch (e) {
      console.warn('Populate error:', e);
    }
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.items).then(resolve, reject);
  }
}

class SingleDocQueryBuilder {
  constructor(item, model) {
    this.item = item ? new DocWrapper(item, model) : null;
    this.model = model;
  }

  select(fieldsStr) {
    if (!this.item || !fieldsStr) return this;
    const fields = fieldsStr.split(' ').filter(Boolean);
    const exclude = fields.filter(f => f.startsWith('-')).map(f => f.slice(1));
    if (exclude.length > 0) {
      exclude.forEach(f => delete this.item[f]);
    }
    return this;
  }

  populate(field, selectFields) {
    if (!this.item) return this;
    try {
      const refMap = {
        studentId: 'users',
        createdBy: 'users',
        examId: 'exams',
        submissionId: 'submissions',
      };
      const targetCollection = refMap[field];
      if (targetCollection) {
        const targetModel = new FileModel(targetCollection);
        const allTargets = targetModel._readAll();
        const targetId = this.item[field];
        if (targetId) {
          let matched = allTargets.find(t => String(t._id) === String(targetId && targetId._id ? targetId._id : targetId));
          if (matched) {
            if (selectFields) {
              const keep = selectFields.split(' ').filter(Boolean);
              const projected = {};
              keep.forEach(k => { projected[k] = matched[k]; });
              projected._id = matched._id;
              matched = projected;
            }
            this.item[field] = matched;
          }
        }
      }
    } catch (e) {
      console.warn('Populate error:', e);
    }
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve(this.item).then(resolve, reject);
  }
}

module.exports = { FileModel, DocWrapper };
