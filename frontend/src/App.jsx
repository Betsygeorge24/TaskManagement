import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '' });
  const [auth, setAuth] = useState({ email: '', password: '', name: '', isLogin: true });
  const [popup, setPopup] = useState({ open: false, message: '', type: 'error' });

  const token = user?.token;

  const showPopup = (message, type = 'error') => {
    setPopup({ open: true, message, type });
  };

  const fetchUsers = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
  };

  const fetchTasks = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTasks(await res.json());
  };

  useEffect(() => {
    const stored = localStorage.getItem('taskUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchTasks();
    }
  }, [token]);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const endpoint = auth.isLogin ? 'login' : 'register';
    const body = auth.isLogin ? { email: auth.email, password: auth.password } : auth;

    const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data);
      localStorage.setItem('taskUser', JSON.stringify(data));
      setAuth({ ...auth, password: '' });
      setPopup({ open: false, message: '', type: 'error' });
      return;
    }

    const errorData = await res.json().catch(() => ({}));
    showPopup(errorData.message || 'Unable to complete the request.');
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ title: '', description: '', assignedTo: '' });
      fetchTasks();
      return;
    }

    const errorData = await res.json().catch(() => ({}));
    showPopup(errorData.message || 'Unable to create task.');
  };

  const handleStatusChange = async (task, status) => {
    const res = await fetch(`${API_BASE}/tasks/${task._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...task, status })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showPopup(errorData.message || 'Unable to update task.');
      return;
    }

    fetchTasks();
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showPopup(errorData.message || 'Unable to delete task.');
      return;
    }

    fetchTasks();
  };

  const logout = () => {
    localStorage.removeItem('taskUser');
    setUser(null);
    setTasks([]);
    setUsers([]);
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Task Management Dashboard</h1>
        {user && (
          <div className="user-bar">
            <span>{user.name}</span>
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </header>

      {!user ? (
        <main className="auth-panel">
          <h2>{auth.isLogin ? 'Login' : 'Register'}</h2>
          <form onSubmit={handleAuthSubmit}>
            {!auth.isLogin && (
              <input
                placeholder="Name"
                value={auth.name}
                onChange={(e) => setAuth({ ...auth, name: e.target.value })}
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={auth.email}
              onChange={(e) => setAuth({ ...auth, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={auth.password}
              onChange={(e) => setAuth({ ...auth, password: e.target.value })}
              required
            />
            <button type="submit">Submit</button>
          </form>
          <button className="link-button" onClick={() => { setAuth({ ...auth, isLogin: !auth.isLogin }); setPopup({ open: false, message: '', type: 'error' }); }}>
            {auth.isLogin ? 'Create an account' : 'Have an account? Login'}
          </button>
        </main>
      ) : (
        <main className="dashboard-grid">
          <section className="panel overview-panel">
            <h2>Overview</h2>
            <p>Total tasks: {tasks.length}</p>
            <p>Assigned users: {users.length}</p>
            <p>Open tasks: {tasks.filter((task) => task.status !== 'done').length}</p>
          </section>

          <section className="panel task-form-panel">
            <h2>Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((userItem) => (
                  <option key={userItem._id} value={userItem._id}>
                    {userItem.name}
                  </option>
                ))}
              </select>
              <button type="submit">Create Task</button>
            </form>
          </section>

          <section className="panel tasks-panel">
            <h2>Tasks</h2>
            <div className="task-list">
              {tasks.map((task) => (
                <article key={task._id} className="task-card">
                  <div className="task-meta">
                    <strong>{task.title}</strong>
                    <span>{task.status.replace('_', ' ')}</span>
                  </div>
                  <p>{task.description}</p>
                  <p>
                    Assigned to: {task.assignedTo?.name || 'Unassigned'}
                  </p>
                  <div className="task-actions">
                    <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button className="danger" onClick={() => handleDelete(task._id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {popup.open && (
        <div className="popup-backdrop" role="dialog" aria-modal="true">
          <div className="popup-card">
            <h3>{popup.type === 'success' ? 'Success' : 'Notice'}</h3>
            <p>{popup.message}</p>
            <button onClick={() => setPopup({ open: false, message: '', type: 'error' })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
