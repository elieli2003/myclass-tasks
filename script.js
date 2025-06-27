// MyClass Tasks - Student Productivity System
class MyClassTasks {
    constructor() {
        this.subjects = JSON.parse(localStorage.getItem('myclass_subjects')) || [];
        this.currentSubjectId = null;
        this.editingSubjectId = null;
        this.editingActivityId = null;
        
        this.initializeEventListeners();
        this.renderSubjects();
        this.setupNotifications();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Subject modal events
        document.getElementById('add-subject-btn').addEventListener('click', () => this.openSubjectModal());
        document.getElementById('close-subject-modal').addEventListener('click', () => this.closeSubjectModal());
        document.getElementById('cancel-subject').addEventListener('click', () => this.closeSubjectModal());
        document.getElementById('subject-form').addEventListener('submit', (e) => this.handleSubjectSubmit(e));

        // Activity modal events
        document.getElementById('add-activity-btn').addEventListener('click', () => this.openActivityModal());
        document.getElementById('close-activity-modal').addEventListener('click', () => this.closeActivityModal());
        document.getElementById('cancel-activity').addEventListener('click', () => this.closeActivityModal());
        document.getElementById('activity-form').addEventListener('submit', (e) => this.handleActivitySubmit(e));

        // Navigation events
        document.getElementById('back-to-home').addEventListener('click', () => this.showHomeScreen());

        // Modal backdrop clicks
        document.getElementById('subject-modal').addEventListener('click', (e) => {
            if (e.target.id === 'subject-modal') this.closeSubjectModal();
        });
        document.getElementById('activity-modal').addEventListener('click', (e) => {
            if (e.target.id === 'activity-modal') this.closeActivityModal();
        });

        // Set minimum date for deadline to today
        const deadlineInput = document.getElementById('activity-deadline');
        const today = new Date().toISOString().slice(0, 16);
        deadlineInput.min = today;

        // Color circle picker logic
        window.addEventListener('DOMContentLoaded', function() {
            const picker = document.getElementById('color-circle-picker');
            if (picker) {
                const circles = picker.querySelectorAll('.color-circle');
                const colorInput = document.getElementById('subject-color');
                const customCircle = picker.querySelector('.custom-color-circle');
                const customColorInput = document.getElementById('custom-color-input');
                circles.forEach(circle => {
                    if (!circle.classList.contains('custom-color-circle')) {
                        circle.addEventListener('click', function() {
                            circles.forEach(c => c.classList.remove('selected'));
                            this.classList.add('selected');
                            colorInput.value = this.getAttribute('data-color');
                        });
                    }
                });
                // Restore native color input logic
                if (customCircle && customColorInput) {
                    customCircle.addEventListener('click', function(e) {
                        customColorInput.click();
                        e.stopPropagation();
                    });
                    customColorInput.addEventListener('input', function() {
                        circles.forEach(c => c.classList.remove('selected'));
                        customCircle.classList.add('selected');
                        colorInput.value = this.value;
                        customCircle.style.background = this.value;
                        customCircle.setAttribute('data-color', this.value);
                        customCircle.style.setProperty('--custom-color', this.value);
                    });
                }
                // Set default selected
                const defaultColor = colorInput.value;
                let found = false;
                circles.forEach(circle => {
                    if (circle.getAttribute('data-color') === defaultColor) {
                        circle.classList.add('selected');
                        found = true;
                    }
                });
                if (!found && circles[0]) circles[0].classList.add('selected');
            }
        });
    }

    // Screen Management
    showHomeScreen() {
        document.getElementById('home-screen').classList.add('active');
        document.getElementById('subject-detail-screen').classList.remove('active');
        this.currentSubjectId = null;
        this.renderSubjects();
    }

    showSubjectDetail(subjectId) {
        this.currentSubjectId = subjectId;
        document.getElementById('home-screen').classList.remove('active');
        document.getElementById('subject-detail-screen').classList.add('active');
        
        const subject = this.subjects.find(s => s.id === subjectId);
        if (subject) {
            document.getElementById('subject-title').innerHTML = `<i class="fas fa-book"></i> ${subject.name}`;
            this.renderActivities(subjectId);
        }
    }

    // Subject Management
    openSubjectModal(subjectId = null) {
        this.editingSubjectId = subjectId;
        const modal = document.getElementById('subject-modal');
        const title = document.getElementById('subject-modal-title');
        const form = document.getElementById('subject-form');
        const nameInput = document.getElementById('subject-name');
        const colorInput = document.getElementById('subject-color');

        if (subjectId) {
            // Editing existing subject
            const subject = this.subjects.find(s => s.id === subjectId);
            if (subject) {
                title.textContent = 'Edit Subject';
                nameInput.value = subject.name;
                colorInput.value = subject.color;
            }
        } else {
            // Adding new subject
            title.textContent = 'Add New Subject';
            form.reset();
            colorInput.value = '#4CAF50';
        }

        modal.style.display = 'block';
        nameInput.focus();
    }

    closeSubjectModal() {
        document.getElementById('subject-modal').style.display = 'none';
        this.editingSubjectId = null;
    }

    handleSubjectSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('subject-name').value.trim();
        const color = document.getElementById('subject-color').value;

        if (!name) {
            this.showNotification('Please enter a subject name', 'error');
            return;
        }

        if (this.editingSubjectId) {
            // Update existing subject
            const index = this.subjects.findIndex(s => s.id === this.editingSubjectId);
            if (index !== -1) {
                this.subjects[index].name = name;
                this.subjects[index].color = color;
                this.showNotification('Subject updated successfully!', 'success');
            }
        } else {
            // Add new subject
            const newSubject = {
                id: this.generateId(),
                name: name,
                color: color,
                activities: [],
                createdAt: new Date().toISOString()
            };
            this.subjects.push(newSubject);
            this.showNotification('Subject added successfully!', 'success');
        }

        this.saveData();
        this.closeSubjectModal();
        this.renderSubjects();
    }

    deleteSubject(subjectId) {
        if (confirm('Are you sure you want to delete this subject? All activities will be lost.')) {
            this.subjects = this.subjects.filter(s => s.id !== subjectId);
            this.saveData();
            this.renderSubjects();
            this.showNotification('Subject deleted successfully!', 'success');
        }
    }

    // Activity Management
    openActivityModal(activityId = null) {
        if (!this.currentSubjectId) return;

        this.editingActivityId = activityId;
        const modal = document.getElementById('activity-modal');
        const title = document.getElementById('activity-modal-title');
        const form = document.getElementById('activity-form');
        const titleInput = document.getElementById('activity-title');
        const typeInput = document.getElementById('activity-type');
        const descriptionInput = document.getElementById('activity-description');
        const deadlineInput = document.getElementById('activity-deadline');

        if (activityId) {
            // Editing existing activity
            const subject = this.subjects.find(s => s.id === this.currentSubjectId);
            const activity = subject.activities.find(a => a.id === activityId);
            if (activity) {
                title.textContent = 'Edit Activity';
                titleInput.value = activity.title;
                typeInput.value = activity.type;
                descriptionInput.value = activity.description || '';
                deadlineInput.value = activity.deadline;
            }
        } else {
            // Adding new activity
            title.textContent = 'Add New Activity';
            form.reset();
            // Set default deadline to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            deadlineInput.value = tomorrow.toISOString().slice(0, 16);
        }

        modal.style.display = 'block';
        titleInput.focus();
    }

    closeActivityModal() {
        document.getElementById('activity-modal').style.display = 'none';
        this.editingActivityId = null;
    }

    handleActivitySubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('activity-title').value.trim();
        const type = document.getElementById('activity-type').value;
        const description = document.getElementById('activity-description').value.trim();
        const deadline = document.getElementById('activity-deadline').value;

        if (!title || !type || !deadline) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubjectId);
        if (subjectIndex === -1) return;

        if (this.editingActivityId) {
            // Update existing activity
            const activityIndex = this.subjects[subjectIndex].activities.findIndex(a => a.id === this.editingActivityId);
            if (activityIndex !== -1) {
                this.subjects[subjectIndex].activities[activityIndex] = {
                    ...this.subjects[subjectIndex].activities[activityIndex],
                    title,
                    type,
                    description,
                    deadline,
                    updatedAt: new Date().toISOString()
                };
                this.showNotification('Activity updated successfully!', 'success');
            }
        } else {
            // Add new activity
            const newActivity = {
                id: this.generateId(),
                title,
                type,
                description,
                deadline,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.subjects[subjectIndex].activities.push(newActivity);
            this.showNotification('Activity added successfully!', 'success');
        }

        this.saveData();
        this.closeActivityModal();
        this.renderActivities(this.currentSubjectId);
        this.renderSubjects(); // Update subject cards with new activity count
    }

    deleteActivity(activityId) {
        if (confirm('Are you sure you want to delete this activity?')) {
            const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubjectId);
            if (subjectIndex !== -1) {
                this.subjects[subjectIndex].activities = this.subjects[subjectIndex].activities.filter(a => a.id !== activityId);
                this.saveData();
                this.renderActivities(this.currentSubjectId);
                this.renderSubjects();
                this.showNotification('Activity deleted successfully!', 'success');
            }
        }
    }

    toggleActivityComplete(activityId) {
        const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubjectId);
        if (subjectIndex !== -1) {
            const activityIndex = this.subjects[subjectIndex].activities.findIndex(a => a.id === activityId);
            if (activityIndex !== -1) {
                this.subjects[subjectIndex].activities[activityIndex].completed = 
                    !this.subjects[subjectIndex].activities[activityIndex].completed;
                this.saveData();
                this.renderActivities(this.currentSubjectId);
                this.renderSubjects();
            }
        }
    }

    // Rendering Functions
    renderSubjects() {
        const container = document.getElementById('subjects-list');
        
        if (this.subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>No subjects yet</h3>
                    <p>Start by adding your first subject to organize your activities</p>
                    <button class="activity-btn" onclick="app.openSubjectModal()">
                      <span class="plus-icon">+</span>
                      <span class="btn-text">Add Your First Subject</span>
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.subjects.map(subject => {
            const activities = subject.activities || [];
            const completedCount = activities.filter(a => a.completed).length;
            const totalCount = activities.length;
            const urgentActivities = activities.filter(a => this.isUrgent(a.deadline) && !a.completed);
            const activityLabel = totalCount === 1 ? 'activity' : 'activities';
            return `
                <div class="subject-card" style="border-left-color: ${subject.color}" onclick="app.showSubjectDetail('${subject.id}')">
                    <div class="actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); app.openSubjectModal('${subject.id}')" title="Edit Subject">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="event.stopPropagation(); app.deleteSubject('${subject.id}')" title="Delete Subject">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <h3><i class="fas fa-book" style="margin-right:8px;color:${subject.color};"></i>${subject.name}</h3>
                    <div class="activity-count">
                        ${totalCount} ${activityLabel} 
                        ${completedCount > 0 ? `(${completedCount} completed)` : ''}
                    </div>
                    ${urgentActivities.length > 0 ? 
                        `<div class="deadline-info">
                            <i class="fas fa-exclamation-triangle"></i> 
                            ${urgentActivities.length} urgent deadline${urgentActivities.length !== 1 ? 's' : ''}
                        </div>` : ''
                    }
                </div>
            `;
        }).join('');
    }

    renderActivities(subjectId) {
        const container = document.getElementById('activities-list');
        const subject = this.subjects.find(s => s.id === subjectId);
        
        if (!subject || !subject.activities || subject.activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No activities yet</h3>
                    <p>Add your first activity to start tracking your progress</p>
                    <button class="activity-btn" onclick="app.openActivityModal()">
                      <span class="plus-icon">+</span>
                      <span class="btn-text">Add Your First Activity</span>
                    </button>
                </div>
            `;
            return;
        }

        // Sort activities by deadline (urgent first, then by date)
        const sortedActivities = [...subject.activities].sort((a, b) => {
            const aUrgent = this.isUrgent(a.deadline) && !a.completed;
            const bUrgent = this.isUrgent(b.deadline) && !b.completed;
            
            if (aUrgent && !bUrgent) return -1;
            if (!aUrgent && bUrgent) return 1;
            
            return new Date(a.deadline) - new Date(b.deadline);
        });

        container.innerHTML = sortedActivities.map(activity => {
            const deadlineClass = this.getDeadlineClass(activity.deadline, activity.completed);
            const deadlineText = this.formatDeadline(activity.deadline);
            
            return `
                <div class="activity-item ${activity.completed ? 'completed' : ''} ${deadlineClass}">
                    <div class="activity-actions">
                        <button class="action-btn edit" onclick="app.openActivityModal('${activity.id}')" title="Edit Activity">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="app.deleteActivity('${activity.id}')" title="Delete Activity">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="activity-header">
                        <div>
                            <div class="activity-title ${activity.completed ? 'completed' : ''}">
                                ${activity.completed ? '<i class="fas fa-check-circle"></i> ' : ''}${activity.title}
                            </div>
                            <span class="activity-type">${activity.type}</span>
                        </div>
                    </div>
                    ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
                    <div class="activity-deadline ${deadlineClass}">
                        <i class="fas fa-clock"></i>
                        ${deadlineText}
                    </div>
                    ${!activity.completed ? `
                        <button class="btn btn-secondary" style="margin-top: 10px;" onclick="app.toggleActivityComplete('${activity.id}')">
                            <i class="fas fa-check"></i> Mark as Complete
                        </button>
                    ` : `
                        <button class="btn btn-secondary" style="margin-top: 10px;" onclick="app.toggleActivityComplete('${activity.id}')">
                            <i class="fas fa-undo"></i> Mark as Incomplete
                        </button>
                    `}
                </div>
            `;
        }).join('');
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveData() {
        localStorage.setItem('myclass_subjects', JSON.stringify(this.subjects));
    }

    isUrgent(deadline) {
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 3 && diffDays >= 0;
    }

    isOverdue(deadline) {
        return new Date(deadline) < new Date();
    }

    getDeadlineClass(deadline, completed) {
        if (completed) return 'completed';
        if (this.isOverdue(deadline)) return 'overdue';
        if (this.isUrgent(deadline)) return 'urgent';
        return 'normal';
    }

    formatDeadline(deadline) {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const diffTime = deadlineDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays <= 7) {
            return `Due in ${diffDays} days`;
        } else {
            return deadlineDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add notification styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: slideInRight 0.3s ease;
                    max-width: 300px;
                }
                .notification-success { background: #4CAF50; }
                .notification-error { background: #f44336; }
                .notification-info { background: #2196F3; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .activity-item.completed .activity-title {
                    text-decoration: line-through;
                    opacity: 0.7;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Notification Setup (for future browser notifications)
    setupNotifications() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            // Request permission for future browser notifications
            Notification.requestPermission();
        }
    }
}

// Initialize the application
const app = new MyClassTasks();

// Add global error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    app.showNotification('An error occurred. Please try again.', 'error');
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to add new subject
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        app.openSubjectModal();
    }
    
    // Ctrl/Cmd + Shift + N to add new activity
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (app.currentSubjectId) {
            app.openActivityModal();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        app.closeSubjectModal();
        app.closeActivityModal();
    }
});

// Request notification permission on load
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Function to notify about urgent deadlines
function notifyUrgentDeadlines(subjects) {
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  subjects.forEach(subject => {
    (subject.activities || []).forEach(activity => {
      if (!activity.completed) {
        const deadline = new Date(activity.deadline);
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= 0) {
          // Avoid duplicate notifications by using a unique key in localStorage
          const notifKey = `notified_${subject.id}_${activity.id}_${deadline.toISOString().slice(0,10)}`;
          if (!localStorage.getItem(notifKey)) {
            new Notification('Upcoming Deadline!', {
              body: `${activity.title} for ${subject.name} is due in ${diffDays} day(s)!`,
              icon: 'icon-192.png'
            });
            localStorage.setItem(notifKey, '1');
          }
        }
      }
    });
  });
}

// Call on app load
window.addEventListener('load', function() {
  if (typeof app !== 'undefined' && app.subjects) {
    notifyUrgentDeadlines(app.subjects);
  }
});
// Also check every hour
setInterval(() => {
  if (typeof app !== 'undefined' && app.subjects) {
    notifyUrgentDeadlines(app.subjects);
  }
}, 60 * 60 * 1000); 