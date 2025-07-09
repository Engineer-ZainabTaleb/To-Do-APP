document.getElementById("taskInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        addTask();
    }
});
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = localStorage.getItem('filter') || 'all';

const saveTasks = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

const saveFilter = (filter) => {
    localStorage.setItem('filter', filter);
};

const addTask = () => {
    const taskInput = document.getElementById("taskInput");
    const dueDateInput = document.getElementById("dueDate");
    const prioritySelect = document.getElementById("priority");

    const text = taskInput.value.trim();
    if (!text) return;

    const dueDate = dueDateInput.value ? new Date(dueDateInput.value).toISOString().slice(0, 10) : null;
    const priority = prioritySelect.value;

    tasks.push({ text, completed: false, dueDate, priority });
    taskInput.value = "";
    dueDateInput.value = "";
    prioritySelect.value = "medium";

    updateTasksList();
    saveTasks();
};

const updateTasksList = () => {
    const taskList = document.getElementById("task-list");
    const counter = document.getElementById("counter");
    taskList.innerHTML = "";

    const filtered = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return !task.completed;
        return task.completed;
    });

    filtered.forEach((task, index) => {
        const listItem = document.createElement("li");
        listItem.className = "taskItem";
        listItem.setAttribute('draggable', true);
        listItem.dataset.index = index;

        // Priority class
        let priorityClass = "";
        switch (task.priority) {
            case 'high': priorityClass = "priority-high"; break;
            case 'medium': priorityClass = "priority-medium"; break;
            case 'low': priorityClass = "priority-low"; break;
        }

        listItem.innerHTML = `
            <div class="task ${task.completed ? 'completed' : ''}">
                <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task completed" />
                <p contenteditable="true" role="textbox" aria-multiline="true" aria-label="Edit task">${task.text}</p>
                <span class="due-date">${task.dueDate ? `Due: ${task.dueDate}` : ''}</span>
                <span class="priority ${priorityClass}" title="Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}"></span>
            </div>
            <div class="icons">
                <button aria-label="Delete task">🗑️</button>
            </div>
        `;

        // Checkbox toggle
        listItem.querySelector(".checkbox").addEventListener("change", () => toggleTaskComplete(index));

        // Delete task
        listItem.querySelector(".icons button").addEventListener("click", () => deleteTask(index));

        // Inline edit
        const editableP = listItem.querySelector("p");
        editableP.addEventListener("input", (e) => {
            tasks[index].text = e.target.textContent.trim();
            saveTasks();
        });
        editableP.addEventListener("keydown", (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                editableP.blur();
            }
        });

        // Drag and drop events
        listItem.addEventListener('dragstart', dragStart);
        listItem.addEventListener('dragover', dragOver);
        listItem.addEventListener('drop', drop);
        listItem.addEventListener('dragend', dragEnd);

        taskList.appendChild(listItem);
    });

    counter.textContent = `${tasks.filter(t => t.completed).length} / ${tasks.length} done`;

    // Update filter buttons aria-pressed
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    });
};

const toggleTaskComplete = (index) => {
    tasks[index].completed = !tasks[index].completed;
    updateTasksList();
    saveTasks();
};

const deleteTask = (index) => {
    if (confirm("Are you sure you want to delete this task?")) {
        tasks.splice(index, 1);
        updateTasksList();
        saveTasks();
    }
};

const setFilter = (filter) => {
    currentFilter = filter;
    saveFilter(filter);
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`.filter-btn[onclick="setFilter('${filter}')"]`).classList.add("active");
    updateTasksList();
};

const clearCompleted = () => {
    tasks = tasks.filter(t => !t.completed);
    updateTasksList();
    saveTasks();
};

// Drag & Drop handlers
let dragSrcIndex = null;

function dragStart(e) {
    dragSrcIndex = +this.dataset.index;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const draggingItem = document.querySelector('.dragging');
    const taskList = document.getElementById('task-list');
    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement == null) {
        taskList.appendChild(draggingItem);
    } else {
        taskList.insertBefore(draggingItem, afterElement);
    }
}

function drop(e) {
    e.preventDefault();
    this.classList.remove('dragging');
    const taskList = document.getElementById('task-list');
    const newOrder = [];
    taskList.querySelectorAll('li').forEach(li => {
        const idx = +li.dataset.index;
        newOrder.push(tasks[idx]);
    });
    tasks = newOrder;
    updateTasksList();
    saveTasks();
}

function dragEnd(e) {
    this.classList.remove('dragging');
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.taskItem:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Event Listeners
document.getElementById("newTask").addEventListener("click", addTask);

document.getElementById("taskInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addTask();
    }
});

document.getElementById("clearCompletedBtn").addEventListener("click", clearCompleted);

// Initialize filter buttons
setFilter(currentFilter);
updateTasksList();
