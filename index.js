const Fields = require('tre-field-observer')
const Str = require('tre-string')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/computed')
const styles = require('module-styles')('tre-contacts')

module.exports = function(ssb, iconByName) {

  styles(`
  `)

  return function(kv, ctx) {
    if (kv.value.content.type !== 'contact') return
    const fields = Fields(ssb)(kv, ctx)
    const contentObs = ctx.contentObs || Value({})
    function set(o) {
      contentObs.set(Object.assign({}, contentObs(), o))
    }
    function rm(key) {
      const o = Object.assign({}, contentObs())
      delete o[key]
      contentObs.set(o)
    }
    const renderStr = Str({
      save: name => set({name})
    })

    function renderField(name, label, type) {
      type = type || 'text'
      return [
        h(`label.${name}`, label),
        h(`input.${name}`, {
          type,
          value: fields.get(name),
          'ev-change': ev => set({[name]: ev.target.value})
        })
      ]

    }

    function renderList(name, label, propNames, type) {
      type = type || 'text'
      const keys = computed(fields.get(name), o => {
        if (typeof o !== 'object') return null
        return Object.keys(o)
      })
      return [
        h(`label.${name}`, label),
        h('.add', {
          'ev-click': ev => {
            const parentObs = fields.get(`${name}`)

            // make sure the value is an obect
            let oldParentValue = parentObs()
            if (typeof oldParentValue !== 'object') {
              if (oldParentValue !== undefined) {
                oldParentValue = {default: oldParentValue}
              } else oldParentValue = {}
            }
            const existingKeys = Object.keys(oldParentValue)
            const newKey = creteNewKey(existingKeys, propNames)
            const newParentValue = Object.assign({}, oldParentValue, {[newKey]: ''})
            set({[name]: newParentValue})
          }
        }, [iconByName('add circle outline')]),
        computed(keys, keys =>{
          if (!keys) {
            return h(`input.${name}.list-single`, {
              type,
              value: fields.get(name, ''),
              'ev-change': ev => set({[name]: ev.target.value})
            })
          }
          return h('ul', [
            keys.map(key => {
              const valueObs = fields.get(`${name}.${key}`)
              const parentObs = fields.get(`${name}`)
              return h('li', [
                h('label', Str({
                  save: newKey => {
                    const parentObs = fields.get(`${name}`)
                    const oldValue = parentObs()[key]
                    const parentValue = parentObs()
                    const newParentValue = Object.assign({}, parentValue, {[newKey]: oldValue})
                    delete newParentValue[key]
                    set({[name]: newParentValue})
                  }
                })(key)),
                h('input', {
                  type,
                  value: valueObs,
                  'ev-change': ev => {
                    const newParentValue = Object.assign({}, parentObs(), {[key]: ev.target.value})
                    set({[name]: newParentValue})
                  }
                }),
                h('.remove', {
                  'ev-click': ev => {
                    let newParentValue = Object.assign({}, parentObs())
                    delete newParentValue[key]
                    if (!Object.keys(newParentValue).length) {
                      rm(name)
                    } else {
                      set({[name]: newParentValue})
                    }
                  }
                }, [
                  iconByName('backspace')
                ])
              ])
            })
          ])
        })
      ]
    }

    return h('.tre-contacts', [
      renderStr(fields.get('name', 'no name')),
      renderField('fullName', 'Full Name'),
      renderList('phone', 'Phone', ['home','mobile','office','private'], 'tel'),
      renderList('email', 'Email', ['work','private'], 'email'),
      renderList('urls', 'URLs', ['blog', 'twitter', 'github'], 'url'),
      h('label.address', 'Address'),
      h('textarea.address', {
        rows: 4,
        cols: 40,
        value: fields.get('address', ''),
        'ev-input': ev => set({address: ev.target.value})
      }),
      h('label.notes', 'Notes'),
      h('textarea.notes', {
        rows: 5,
        cols: 40,
        value: fields.get('notes', ''),
        'ev-input': ev => set({notes: ev.target.value})
      })
    ])
  }
}

// -- utils
function creteNewKey(existingKeys, propNames) {
  //jshint -W083
  let n=0
  do {
    newKey = propNames.find(x => !existingKeys.includes(x))
    if (!newKey) {
      n++
      propNames = propNames.map(pn => {
        return pn.replace(/[0-9]+$/, '') + n
      })
    }
  } while(!newKey)
  return newKey
}
