import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import config, { getAuthHeaders } from '../config';

const MentalHealthResources = ({ onClose, darkMode = false }) => {
    const [resources, setResources] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchResources();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${config.API_URL}/resources/categories`, { headers: getAuthHeaders() });
            const data = await response.json();
            setCategories(['All', ...data.categories]);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchResources = async () => {
        setIsLoading(true);
        try {
            let url = `${config.API_URL}/resources`;
            const params = new URLSearchParams();

            if (selectedCategory !== 'All') {
                params.append('category', selectedCategory);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, { headers: getAuthHeaders() });
            const data = await response.json();
            setResources(data);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResources();
        }, 300);
        return () => clearTimeout(timer);
    }, [selectedCategory, searchQuery]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="page-section pt-24 min-h-screen">
            {/* Header */}
            <div className="nav-dark sticky top-16 z-10 mx-4 rounded-2xl mb-6">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Mental Health Resources</h1>
                                <p className="text-sm text-gray-600">Comprehensive guide to common mental health challenges</p>
                            </div>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search problems, symptoms, or solutions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Filter className="w-5 h-5" />
                            <span>Filters</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Category Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-600">
                        {isLoading ? 'Loading...' : `${resources.length} resources found`}
                    </div>
                </div>
            </div>

            {/* Resources List */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="space-y-4">
                    {resources.map((resource) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                            <button
                                onClick={() => toggleExpand(resource.id)}
                                className="w-full px-6 py-5 flex justify-between items-start text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                            {resource.category}
                                        </span>
                                        <h3 className="text-xl font-semibold text-gray-900">{resource.problem}</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-2">{resource.description}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                    {expandedId === resource.id ? (
                                        <ChevronUp className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {expandedId === resource.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 space-y-6">
                                            {/* Description */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">About This Condition</h4>
                                                <p className="text-gray-700 leading-relaxed">{resource.description}</p>
                                            </div>

                                            {/* Symptoms */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Symptoms</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {resource.symptoms.map((symptom, index) => (
                                                        <div key={index} className="flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                                                            <span className="text-gray-700 text-sm">{symptom}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Solutions */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Solutions & Coping Strategies</h4>
                                                <div className="space-y-3">
                                                    {resource.solutions.map((solution, index) => (
                                                        <div key={index} className="flex gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                                                            <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                                {index + 1}
                                                            </div>
                                                            <p className="text-gray-700 text-sm leading-relaxed">{solution}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Disclaimer */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                                <p className="text-xs text-yellow-800">
                                                    <strong>Note:</strong> These are general suggestions and not a substitute for professional medical advice.
                                                    If you're experiencing severe symptoms, please consult a mental health professional.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {!isLoading && resources.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
                        <p className="text-gray-600">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentalHealthResources;
