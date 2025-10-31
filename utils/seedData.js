// utils/seedData.js
import { supabase } from '../lib/supabase';

export const seedSampleData = async () => {
    const sampleData = [
        {
            title: 'Inner Peace',
            message: 'Peace is not the absence of trouble, but the presence of God.',
            author: 'Unknown',
            type: 'quote',
            is_active: true
        },
        {
            title: 'Daily Hope',
            message: 'Hope is being able to see that there is light despite all of the darkness.',
            author: 'Desmond Tutu',
            type: 'quote',
            is_active: true
        },
        {
            title: 'Strength Today',
            message: 'You are stronger than you think, more capable than you imagine, and loved more than you know.',
            author: 'Unknown',
            type: 'quote',
            is_active: true
        },
        {
            title: 'Morning Prayer',
            message: 'Lord, grant me the strength to face today challenges with grace and the wisdom to see Your hand in everything.',
            author: 'Traditional',
            type: 'prayer',
            is_active: true
        },
        {
            title: 'Prayer for Peace',
            message: 'Heavenly Father, calm my anxious heart and fill me with Your perfect peace that surpasses all understanding.',
            author: 'Unknown',
            type: 'prayer',
            is_active: true
        },
        {
            title: 'Strength in Weakness',
            message: 'My grace is sufficient for you, for my power is made perfect in weakness.',
            author: '2 Corinthians 12:9',
            type: 'verse',
            is_active: true
        },
        {
            title: 'Peace Verse',
            message: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
            author: 'Philippians 4:6',
            type: 'verse',
            is_active: true
        }
    ];

    try {
        const { data, error } = await supabase
            .from('daily_strength')
            .insert(sampleData)
            .select();

        if (error) {
            console.error('Error seeding data:', error);
            return { success: false, error };
        }

        console.log('Sample data seeded successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { success: false, error };
    }
};