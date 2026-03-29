import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { profileService } from '../services/profileService';

interface SkillAutocompleteProps {
  onSelect: (skill: string) => void;
  existingSkills: string[];
  placeholder?: string;
}

export default function SkillAutocomplete({ onSelect, existingSkills, placeholder = "Add skill..." }: SkillAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const skills = await profileService.searchSkills('');
        setSuggestions(skills);
      } catch (error) {
        console.error("Error fetching skills for autocomplete:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredSuggestions([]);
      return;
    }

    const filtered = suggestions.filter(skill => 
      skill.toLowerCase().includes(inputValue.toLowerCase()) && 
      !existingSkills.includes(skill)
    ).slice(0, 10);

    setFilteredSuggestions(filtered);
  }, [inputValue, suggestions, existingSkills]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (skill: string) => {
    onSelect(skill);
    setInputValue('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleSelect(filteredSuggestions[0]);
      } else {
        handleSelect(inputValue.trim());
      }
    }
  };

  return (
    <div className="relative flex-grow" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-700 transition-all text-gray-900 dark:text-white"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (filteredSuggestions.length > 0 || (inputValue.trim() && !existingSkills.includes(inputValue.trim()))) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto py-2">
              {filteredSuggestions.map((skill, index) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSelect(skill)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-zinc-300 flex items-center justify-between group"
                >
                  <span>{skill}</span>
                  <Plus size={14} className="opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                </button>
              ))}
              
              {inputValue.trim() && !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase()) && !existingSkills.includes(inputValue.trim()) && (
                <button
                  type="button"
                  onClick={() => handleSelect(inputValue.trim())}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Add "{inputValue.trim()}"</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
