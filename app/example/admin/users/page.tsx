"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch("/api/example/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/example/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("User created successfully");
        setShowAddModal(false);
        setFormData({ username: "", password: "", role: "user" });
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create user");
      }
    } catch (error) {
      setError("Failed to create user");
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/example/admin/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        setSuccess("User updated successfully");
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ username: "", password: "", role: "user" });
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update user");
      }
    } catch (error) {
      setError("Failed to update user");
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/example/admin/users/${selectedUser.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setSuccess("User deleted successfully");
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete user");
      }
    } catch (error) {
      setError("Failed to delete user");
    }
  }

  function openEditModal(user: User) {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setShowEditModal(true);
  }

  function openDeleteModal(user: User) {
    setSelectedUser(user);
    setShowDeleteModal(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          User Management
        </h2>
        <button
          onClick={() => {
            setFormData({ username: "", password: "", role: "user" });
            setShowAddModal(true);
          }}
          className="btn-accent cursor-pointer"
        >
          Add User
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-success/10 border border-success/20 text-success rounded-xl animate-fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl animate-fade-in">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow-soft rounded-xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-primary/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-accent/10 text-accent"
                        : "bg-gray-100 text-muted-foreground"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-primary hover:text-primary-light mr-4 transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-elevated mx-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-6">
              Add New User
            </h3>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="input-enhanced"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input-enhanced"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-enhanced"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent cursor-pointer">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-elevated mx-4">
            <h3 className="font-display text-xl font-bold text-foreground mb-6">
              Edit User
            </h3>
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="input-enhanced"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password{" "}
                  <span className="text-muted-foreground font-normal">
                    (leave empty to keep current)
                  </span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input-enhanced"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-enhanced"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-elevated mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Confirm Delete
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete user{" "}
              <span className="font-semibold text-foreground">
                &quot;{selectedUser.username}&quot;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-5 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 font-semibold transition-colors cursor-pointer"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
