import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Activity, Sparkles, CheckCircle, AlertCircle, Calendar, Brain } from 'lucide-react';
import InnerCriticTool from './InnerCriticTool';
import config, { getAuthHeaders } from '../config';

const WellnessTools = ({ darkMode = false }) => {
    const [reminders, setReminders] = useState([]);
    const [newActivity, setNewActivity] = useState('');
    const [newTime, setNewTime] = useState('');
    const [routineType, setRoutineType] = useState('anxiety');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('routine');

    // Load reminders from local storage on mount
    useEffect(() => {
        const savedReminders = localStorage.getItem('anchor_reminders');
        if (savedReminders) {
            setReminders(JSON.parse(savedReminders));
        }
    }, []);

    // Save reminders to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('anchor_reminders', JSON.stringify(reminders));
    }, [reminders]);

    // Check for reminders every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            reminders.forEach(reminder => {
                if (reminder.time === currentTime && !reminder.notified) {
                    // Simple browser notification or alert
                    if (Notification.permission === "granted") {
                        new Notification(`Braino AI Reminder: ${reminder.activity}`);
                    } else if (Notification.permission !== "denied") {
                        Notification.requestPermission().then(permission => {
                            if (permission === "granted") {
                                new Notification(`Braino AI Reminder: ${reminder.activity}`);
                            }
                        });
                    } else {
                        alert(`Reminder: ${reminder.activity}`);
                    }
                }
            });
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [reminders]);

    const addReminder = (e) => {
        e.preventDefault();
        if (!newActivity || !newTime) return;

        const newReminder = {
            id: Date.now(),
            activity: newActivity,
            time: newTime,
            notified: false
        };

        setReminders([...reminders, newReminder].sort((a, b) => a.time.localeCompare(b.time)));
        setNewActivity('');
        setNewTime('');
    };

    const deleteReminder = (id) => {
        setReminders(reminders.filter(r => r.id !== id));
    };

    const generateRoutine = async () => {
        setIsLoading(true);
        try {
           const response = await fetch(`${config.API_URL}/routine/suggest`, {
                method: 'POST',
                headers: getAuthHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify({ problem: routineType }),
            });

            if (!response.ok) throw new Error('Failed to fetch routine');

            const data = await response.json();

            // Convert API format to our reminder format
            const newRoutine = data.routine.map((task, index) => ({
                id: Date.now() + index,
                activity: task.activity,
                time: convertTo24Hour(task.time), // Helper needed if API returns AM/PM
                notified: false
            }));

            // Merge or replace? Let's replace for this feature to keep it simple for the user
            if (window.confirm("This will replace your current schedule. Are you sure?")) {
                setReminders(newRoutine.sort((a, b) => a.time.localeCompare(b.time)));
            }

        } catch (error) {
            console.error("Error generating routine:", error);
            alert("Could not generate routine. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to convert "08:00 AM" to "08:00" for input type="time" compatibility
    const convertTo24Hour = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return `${hours}:${minutes}`;
    };

    return (
        <div className="page-section pt-24 py-12 min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-4xl font-extrabold sm:text-5xl transition-colors ${darkMode ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600'}`}
                    >
                        Wellness Tools
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={`mt-4 text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                    >
                        Empower your daily journey with AI-driven routines and tools.
                    </motion.p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm p-1.5 inline-flex border border-gray-200">
                        <button
                            onClick={() => setActiveTab('routine')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'routine'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Routine & Reminders
                        </button>
                        <button
                            onClick={() => setActiveTab('inner-critic')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'inner-critic'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            Inner Critic Silencer
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'inner-critic' ? (
                        <motion.div
                            key="inner-critic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <InnerCriticTool />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="routine"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Routine Generator */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">AI Routine Generator</h3>
                                    </div>
                                    <p className="text-gray-600 mb-6">Select a focus area to generate a balanced daily schedule tailored for you.</p>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">I need help with:</label>
                                            <div className="relative">
                                                <select
                                                    value={routineType}
                                                    onChange={(e) => setRoutineType(e.target.value)}
                                                    className="block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50 transition-all hover:bg-white"
                                                >
                                                    <option value="anxiety">Anxiety & Stress</option>
                                                    <option value="sleep">Better Sleep</option>
                                                    <option value="focus">Productivity & Focus</option>
                                                    <option value="general">General Wellbeing</option>
                                                </select>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={generateRoutine}
                                            disabled={isLoading}
                                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all ${isLoading
                                                ? 'bg-indigo-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-500/30'
                                                }`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Generate Routine
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </motion.div>

                                {/* Add Manual Reminder */}
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">Add Reminder</h3>
                                    </div>
                                    <form onSubmit={addReminder} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Activity</label>
                                            <div className="relative">
                                                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    value={newActivity}
                                                    onChange={(e) => setNewActivity(e.target.value)}
                                                    placeholder="e.g., Drink water"
                                                    className="block w-full pl-10 pr-4 py-3 border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="time"
                                                    value={newTime}
                                                    onChange={(e) => setNewTime(e.target.value)}
                                                    className="block w-full pl-10 pr-4 py-3 border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:bg-white"
                                                />
                                            </div>
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/30 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add to Schedule
                                        </motion.button>
                                    </form>
                                </motion.div>
                            </div>

                            {/* Schedule View */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/20">
                                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-indigo-600" />
                                        Your Daily Schedule
                                    </h3>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    <AnimatePresence initial={false}>
                                        {reminders.length === 0 ? (
                                            <motion.li
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="px-8 py-12 text-center text-gray-500 flex flex-col items-center gap-3"
                                            >
                                                <div className="p-4 bg-gray-100 rounded-full">
                                                    <AlertCircle className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-lg">No reminders set yet.</p>
                                                <p className="text-sm">Add one manually or generate a routine to get started!</p>
                                            </motion.li>
                                        ) : (
                                            reminders.map((reminder) => (
                                                <motion.li
                                                    key={reminder.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="px-8 py-5 flex items-center justify-between hover:bg-indigo-50/30 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:scale-110 transition-transform duration-200">
                                                            {reminder.time}
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-medium text-gray-900">{reminder.activity}</p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Scheduled
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, color: "#ef4444" }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => deleteReminder(reminder.id)}
                                                        className="p-2 text-gray-400 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </motion.button>
                                                </motion.li>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WellnessTools;
