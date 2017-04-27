(function () {
  var todoStorage = {
    uid: 0
  };

  var pm = h5page('.todoapp', {
    data: {
      todos: [],
      editedTodo: null,
      visibility: getVisibility(),
    },
    methods: {
      addTodo: function (value) {
        if (!value) {
          return;
        }
        this.todos.push({
          id: todoStorage.uid++,
          title: value,
          completed: false
        });
      },

      editTodo: function (todo) {
        this.editedTodo = todo;
      },

      removeTodo: function (todo) {
        var index = this.todos.indexOf(todo);
        if (index >= 0) {
          this.todos.splice(index, 1);
        }
      },

      doneEdit: function (todo, value) {
        todo.title = value;
        this.editedTodo = null;
      },

      cancelEdit: function(todo) {
        this.editedTodo = null;
      },

      allDone: function (completed) {
        this.todos.forEach(function (todo) {
          todo.completed = completed;
        });
      },

      removeCompleted: function () {
        this.todos = this.todos.filter(function (todo) {
          return !todo.completed;
        });
      }

    }
  });

  function getVisibility() {
    switch (location.hash) {
      case '#/completed':
        return 'completed';
        break;
      case '#/active':
        return 'active';
        break;
      default:
        return 'all';
    }
  }

  window.addEventListener('hashchange', function () {
    pm.visibility = getVisibility()
  });
})();
