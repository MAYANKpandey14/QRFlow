
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    type?: 'default' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, type = 'default' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto border border-border"
                        >
                            <div className={cn(
                                "p-4 border-b border-border flex justify-between items-center",
                                type === 'danger' ? 'bg-destructive/10' : 'bg-card'
                            )}>
                                <h3 className={cn(
                                    "font-bold flex items-center gap-2",
                                    type === 'danger' ? 'text-destructive' : 'text-foreground'
                                )}>
                                    {type === 'danger' && <AlertTriangle size={18} />}
                                    {title}
                                </h3>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X size={20} />
                                </Button>
                            </div>
                            <div className="p-6">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
