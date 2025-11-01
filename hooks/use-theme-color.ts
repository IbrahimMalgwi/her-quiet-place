// hooks/use-theme-color.ts
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme'; // Import named export

export function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
    const theme = useColorScheme() ?? 'light';
    const colorFromProps = props[theme];

    if (colorFromProps) {
        return colorFromProps;
    }

    // Safe fallback - now we can properly index Colors
    return Colors[theme][colorName] ?? '#4A4A4A';
}