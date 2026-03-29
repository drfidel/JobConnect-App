import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { UserProfile, Experience, Education } from '../types';
import { User, Mail, Briefcase, MapPin, Plus, Trash2, Save, Loader2, CheckCircle2, AlertCircle, Camera, GraduationCap, Code, FileText, Upload, X, Building2, Calendar } from 'lucide-react';
import SkillAutocomplete from '../components/SkillAutocomplete';
import { motion, AnimatePresence } from 'motion/react';
import { profileService } from '../services/profileService';

export default function Profile() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [experience, setExperience] = useState<Experience[]>(profile?.experience || []);
  const [education, setEducation] = useState<Education[]>(profile?.education || []);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setExperience(profile.experience || []);
      setEducation(profile.education || []);
    }
  }, [profile]);

  const handleFileUpload = async (file: File, type: 'photo' | 'resume') => {
    if (!user) return;
    setUploading(true);
    setError('');

    try {
      const downloadURL = await profileService.uploadFile(user.uid, file, type === 'photo' ? 'avatars' : 'resumes');
      await profileService.updateProfile(user.uid, {
        [type === 'photo' ? 'photoURL' : 'resumeURL']: downloadURL
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await profileService.updateProfile(user.uid, {
        displayName,
        bio,
        skills,
        experience,
        education
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Math.random().toString(36).substring(2, 9),
      company: '',
      position: '',
      location: '',
      startDate: '',
      current: false,
      description: ''
    };
    setExperience([...experience, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperience(experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Math.random().toString(36).substring(2, 9),
      school: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      description: ''
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">My Profile</h1>
          <p className="text-gray-500 dark:text-zinc-400">Keep your professional information up to date to attract the best opportunities.</p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-3xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 border-4 border-white dark:border-zinc-900 shadow-lg overflow-hidden">
                {profile?.photoURL ? <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} />}
              </div>
              <button 
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all border-2 border-white dark:border-zinc-900"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={photoInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'photo')}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.displayName || 'User'}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{profile?.email}</p>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              profile?.role === 'employer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
            }`}>
              {profile?.role}
            </div>
          </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" /> Resume / CV
              </h4>
              {profile?.resumeURL ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600 dark:text-blue-400" />
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-100">My Resume.pdf</div>
                    </div>
                    <a 
                      href={profile.resumeURL} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </a>
                  </div>
                  <button 
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-gray-500 dark:text-zinc-400 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                  >
                    Replace Resume
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-zinc-600 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <Upload size={24} />
                  <span className="text-sm font-bold">Upload Resume</span>
                </button>
              )}
              <input 
                type="file" 
                ref={resumeInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'resume')}
              />
              {uploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Code size={18} className="text-blue-600 dark:text-blue-400" /> Skills
            </h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {skills.map(skill => (
                <span key={skill} className="group flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-lg border border-gray-100 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="text-gray-300 dark:text-zinc-600 group-hover:text-red-500 dark:group-hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <SkillAutocomplete 
                onSelect={(skill) => {
                  if (!skills.includes(skill)) {
                    setSkills([...skills, skill]);
                  }
                }}
                existingSkills={skills}
              />
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-8">
            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle2 className="text-green-500" size={20} />
                  <p className="text-sm text-green-700 dark:text-green-400 font-bold">Profile updated successfully!</p>
                </motion.div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="text-red-500" size={20} />
                  <p className="text-sm text-red-700 dark:text-red-400 font-bold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Display Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-zinc-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all"
                    placeholder="Your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 ml-1">Professional Bio</label>
                <textarea
                  rows={6}
                  className="block w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all resize-none"
                  placeholder="Tell employers about your background, experience, and what you're looking for..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {/* Work Experience Section */}
              <div className="pt-6 border-t border-gray-50 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="text-blue-600 dark:text-blue-400" size={20} /> Work Experience
                  </h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <Plus size={18} /> Add Experience
                  </button>
                </div>
                
                <div className="space-y-6">
                  {experience.map((exp) => (
                    <div key={exp.id} className="p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 relative group">
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Company</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            placeholder="e.g. Google"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Position</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={exp.position}
                            onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                            placeholder="e.g. Senior Developer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Start Date</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            placeholder="e.g. Jan 2020"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">End Date</label>
                          <input
                            type="text"
                            disabled={exp.current}
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white disabled:opacity-50"
                            value={exp.endDate || ''}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            placeholder={exp.current ? 'Present' : 'e.g. Dec 2022'}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="checkbox"
                          id={`current-${exp.id}`}
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={`current-${exp.id}`} className="text-sm text-gray-600 dark:text-zinc-400">I currently work here</label>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Description</label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none dark:text-white"
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                          placeholder="Describe your achievements and responsibilities..."
                        />
                      </div>
                    </div>
                  ))}
                  {experience.length === 0 && (
                    <p className="text-center py-8 text-gray-500 dark:text-zinc-500 italic text-sm">No work experience added yet.</p>
                  )}
                </div>
              </div>

              {/* Education Section */}
              <div className="pt-6 border-t border-gray-50 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="text-blue-600 dark:text-blue-400" size={20} /> Education
                  </h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <Plus size={18} /> Add Education
                  </button>
                </div>
                
                <div className="space-y-6">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-800 relative group">
                      <button
                        type="button"
                        onClick={() => removeEducation(edu.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">School / University</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            placeholder="e.g. Makerere University"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Degree</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="e.g. Bachelor of Science"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Field of Study</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={edu.fieldOfStudy}
                            onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Start Date</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                            placeholder="e.g. 2016"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">End Date (or Expected)</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={edu.endDate || ''}
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                            placeholder="e.g. 2020"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 ml-1">Description (Optional)</label>
                        <textarea
                          rows={2}
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none dark:text-white"
                          value={edu.description}
                          onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                          placeholder="Relevant coursework, honors, etc."
                        />
                      </div>
                    </div>
                  ))}
                  {education.length === 0 && (
                    <p className="text-center py-8 text-gray-500 dark:text-zinc-500 italic text-sm">No education history added yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
