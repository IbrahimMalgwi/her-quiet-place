// components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../constants/theme';

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary caught:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return <ErrorFallback onReset={this.resetError} />;
        }

        return this.props.children;
    }
}

interface ErrorFallbackProps {
    onReset: () => void;
}

function ErrorFallback({ onReset }: ErrorFallbackProps) {
    const theme = useTheme();

    return (
        <View style={[theme.screen, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10 }}>
                Something went wrong
            </Text>
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
                There was an error in the application. Please try again or restart the app.
            </Text>
            <TouchableOpacity
                style={[theme.button, { backgroundColor: theme.colors.accentPrimary }]}
                onPress={onReset}
            >
                <Text style={[theme.buttonText, { color: theme.colors.textInverse }]}>
                    Try Again
                </Text>
            </TouchableOpacity>
        </View>
    );
}

export default ErrorBoundary;