import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickActionButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${isOpen
                        ? 'bg-slate-800 rotate-45'
                        : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-110'
                    }`}
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Plus size={28} className="text-white" />
                )}
            </button>

            {/* Quick Action Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/20 z-30 animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu Items */}
                    <div className="fixed bottom-40 right-6 z-40 space-y-3 animate-slide-up">
                        <Link
                            to="/add"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-medium text-slate-800 pr-2">Add Expense</span>
                        </Link>

                        <Link
                            to="/bulk-add"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-medium text-slate-800 pr-2">Bulk Add</span>
                        </Link>

                        <Link
                            to="/recurring"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-medium text-slate-800 pr-2">Recurring</span>
                        </Link>
                    </div>
                </>
            )}
        </>
    );
};
