import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Camera, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset: resetProfile } = useForm({
    defaultValues: { name: user?.name || '' },
  });

  const { register: registerPwd, handleSubmit: handlePwdSubmit, formState: { errors: pwdErrors }, reset: resetPwd } = useForm();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const onProfileSave = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      const fileInput = document.getElementById('avatarInput');
      if (fileInput?.files[0]) formData.append('profileImage', fileInput.files[0]);

      const res = await authAPI.updateMe(formData);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordChange = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setChangingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      resetPwd();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Profile info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-violet-600" /> Personal Info
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden">
              {avatarPreview || user?.profileImage ? (
                <img src={avatarPreview || user.profileImage} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-violet-600">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('avatarInput').click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 transition-colors"
              aria-label="Change profile photo"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input id="avatarInput" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-violet-600 capitalize mt-0.5">{user?.plan} plan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className={`input-field pl-10 ${errors.name ? 'border-red-400' : ''}`}
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })}
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                className="input-field pl-10 opacity-60 cursor-not-allowed"
                value={user?.email || ''}
                disabled
                readOnly
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-violet-600" /> Change Password
        </h2>

        <form onSubmit={handlePwdSubmit(onPasswordChange)} className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Current Password', rule: { required: 'Required' } },
            { name: 'newPassword', label: 'New Password', rule: { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } } },
            { name: 'confirmPassword', label: 'Confirm New Password', rule: { required: 'Required' } },
          ].map((field) => (
            <div key={field.name}>
              <label className="label">{field.label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className={`input-field pl-10 ${pwdErrors[field.name] ? 'border-red-400' : ''}`}
                  {...registerPwd(field.name, field.rule)}
                />
              </div>
              {pwdErrors[field.name] && <p className="mt-1 text-xs text-red-500">{pwdErrors[field.name].message}</p>}
            </div>
          ))}

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Updating…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Plan info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-violet-600 capitalize">{user?.plan} Plan</p>
            <p className="text-sm text-gray-500 mt-1">
              Up to {user?.planLimits?.maxPhotosPerEvent?.toLocaleString()} photos per event ·{' '}
              {user?.planLimits?.allowFaceMatching ? 'AI face matching ✓' : 'Upgrade for AI face matching'}
            </p>
          </div>
          <button className="btn-primary text-sm">Upgrade</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
