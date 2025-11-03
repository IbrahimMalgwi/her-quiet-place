// app/admin/AdminAffirmationsManager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Affirmation {
    id: string;
    affirmation_text: string;
    category: string;
    is_active: boolean;
    used_count: number;
}

export default function AdminAffirmationsManager() {
    const theme = useTheme();
    const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
    const [newAffirmation, setNewAffirmation] = useState('');
    const [category, setCategory] = useState('general');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAffirmations();
    }, []);

    const fetchAffirmations = async () => {
        const { data, error } = await supabase
            .from('daily_affirmations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching affirmations:', error);
        } else {
            setAffirmations(data || []);
        }
    };

    const addAffirmation = async () => {
        if (!newAffirmation.trim()) return;

        setLoading(true);
        const { error } = await supabase
            .from('daily_affirmations')
            .insert([{
                affirmation_text: newAffirmation.trim(),
                category: category
            }]);

        if (error) {
            Alert.alert('Error', 'Failed to add affirmation');
        } else {
            setNewAffirmation('');
            fetchAffirmations();
            Alert.alert('Success', 'Affirmation added successfully');
        }
        setLoading(false);
    };

    const toggleAffirmation = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('daily_affirmations')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', 'Failed to update affirmation');
        } else {
            fetchAffirmations();
        }
    };

    return (
        <View style={theme.container}>
            <Text style={theme.title}>Manage Affirmations</Text>

            {/* Add New Affirmation */}
            <View style={theme.card}>
                <Text style={theme.subtitle}>Add New Affirmation</Text>
                <TextInput
                    style={theme.input}
                    placeholder="Enter affirmation text..."
                    value={newAffirmation}
                    onChangeText={setNewAffirmation}
                    multiline
                    numberOfLines={3}
                />
                <TextInput
                    style={[theme.input, { marginTop: theme.Spacing.sm }]}
                    placeholder="Category (general, strength, peace, etc.)"
                    value={category}
                    onChangeText={setCategory}
                />
                <TouchableOpacity
                    style={[theme.button, { marginTop: theme.Spacing.md }]}
                    onPress={addAffirmation}
                    disabled={loading}
                >
                    <Text style={theme.buttonText}>
                        {loading ? 'Adding...' : 'Add Affirmation'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Affirmations List */}
            <FlatList
                data={affirmations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[
                        theme.card,
                        {
                            marginTop: theme.Spacing.sm,
                            opacity: item.is_active ? 1 : 0.6
                        }
                    ]}>
                        <Text style={theme.text}>{item.affirmation_text}</Text>
                        <View style={theme.rowBetween}>
                            <Text style={[theme.text, { fontSize: 12 }]}>
                                {item.category} • Used {item.used_count} times
                            </Text>
                            <TouchableOpacity
                                onPress={() => toggleAffirmation(item.id, item.is_active)}
                            >
                                <Ionicons
                                    name={item.is_active ? "eye" : "eye-off"}
                                    size={20}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}