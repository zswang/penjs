(function () {
  var STORAGE_KEY = 'todos-penjs-0.0'
  var todoStorage = {
    fetch: function () {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      } catch (ex) {
        return []
      }
    },
    save: function (todos) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    },
  }

  var pm = penjs('.todoapp', {
    data: {
      todos: todoStorage.fetch(),
      editedTodo: null,
      visibility: getVisibility(),
    },
    methods: {
      addTodo: function (value) {
        if (!value) {
          return
        }
        this.todos.push({
          title: value,
          completed: false,
        })
      },

      editTodo: function (todo) {
        this.editedTodo = todo
      },

      removeTodo: function (todo) {
        var index = this.todos.indexOf(todo)
        if (index >= 0) {
          this.todos.splice(index, 1)
        }
      },

      doneEdit: function (todo, value) {
        todo.title = value
        this.editedTodo = null
      },

      cancelEdit: function (todo) {
        this.editedTodo = null
      },

      allDone: function (completed) {
        this.todos.forEach(function (todo) {
          todo.completed = completed
        })
      },

      removeCompleted: function () {
        this.todos = this.todos.filter(function (todo) {
          return !todo.completed
        })
      },

      saveTodos: function () {
        todoStorage.save(this.todos)
      },

    }
  })

  function getVisibility() {
    return {
      '#/completed': 'completed',
      '#/active': 'active',
    }[location.hash] || 'all'
  }

  window.addEventListener('hashchange', function () {
    pm.visibility = getVisibility()
  })
})()
