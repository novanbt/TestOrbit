"use client";

import React, { useState, useEffect } from "react";
import { Shield, Plus, UserCheck, ShieldAlert, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge } from "@/components/admin/StudioUI";
import { AdminUser, AdminRole } from "@/types/admin";
import { saveAdminUserAction, deleteAdminUserAction } from "@/app/actions/adminStudioActions";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";

const INITIAL_ADMINS: AdminUser[] = [
  {
    id: "admin-root-001",
    email: "testorbit@ellipse.com",
    name: "Super Administrator",
    role: "super_admin",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLogin: "Just now",
  },
  {
    id: "admin-content-002",
    email: "faculty@testorbit.in",
    name: "Faculty Lead",
    role: "content_manager",
    active: true,
    createdAt: "2026-02-15T00:00:00.000Z",
    lastLogin: "2 hours ago",
  },
  {
    id: "admin-review-003",
    email: "reviewer@testorbit.in",
    name: "Syllabus Reviewer",
    role: "question_reviewer",
    active: true,
    createdAt: "2026-03-01T00:00:00.000Z",
    lastLogin: "Yesterday",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("content_manager");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAdminUsers = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && db) {
        const snap = await getDocs(collection(db, "adminUsers"));
        if (!snap.empty) {
          const list: AdminUser[] = [];
          snap.forEach((d) => list.push(d.data() as AdminUser));
          // ensure super admin is present
          if (!list.some((u) => u.email === "testorbit@ellipse.com")) {
            list.unshift(INITIAL_ADMINS[0]);
          }
          setUsers(list);
          setLoading(false);
          return;
        }
      }
      setUsers(INITIAL_ADMINS);
    } catch {
      setUsers(INITIAL_ADMINS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    const newUser: AdminUser = {
      id: "admin-" + Date.now().toString(36),
      email: newEmail.trim().toLowerCase(),
      name: newName.trim(),
      role: newRole,
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: "Never",
    };

    const res = await saveAdminUserAction(newUser);
    if (res.success) {
      setUsers((prev) => [...prev, newUser]);
      setFeedback(`Admin user "${newUser.name}" provisioned successfully.`);
      setModalOpen(false);
      setNewEmail("");
      setNewName("");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.email === "testorbit@ellipse.com") {
      alert("The primary Super Administrator account cannot be removed.");
      return;
    }
    if (!window.confirm(`Remove admin account for "${user.name}" (${user.email})?`)) return;

    const res = await deleteAdminUserAction(user.id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setFeedback(`Admin account "${user.email}" removed.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Admin Users & Role Permissions ({users.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control governing platform privileges and moderation authority.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add Admin User</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{u.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60 text-xs">
                      {u.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StudioBadge variant={u.active ? "completed" : "draft"} size="sm">
                      {u.active ? "Active" : "Disabled"}
                    </StudioBadge>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{u.lastLogin || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    {u.email !== "testorbit@ellipse.com" && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Remove user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Provision Admin Account</h3>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"
                >
                  <option value="content_manager">Content Manager</option>
                  <option value="question_reviewer">Question Reviewer</option>
                  <option value="support_staff">Support Staff</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Admin User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
