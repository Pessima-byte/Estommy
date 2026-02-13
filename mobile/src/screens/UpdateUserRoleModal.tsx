import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { X, Check, ShieldCheck } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '../constants/Theme';
import { usersAPI } from '../api/client';

const ROLES = [
    { id: 'ADMIN', label: 'ADMINISTRATOR', color: '#EAB308' },
    { id: 'MANAGER', label: 'MANAGER', color: '#3B82F6' },
    { id: 'USER', label: 'STANDARD USER', color: '#94A3B8' }
];

export default function UpdateUserRoleModal({ user, visible, onClose, onSuccess }: { user: any, visible: boolean, onClose: () => void, onSuccess: () => void }) {
    const [selectedRole, setSelectedRole] = useState(user?.role || 'USER');
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const handleUpdate = async () => {
        if (selectedRole === user.role) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await usersAPI.update(user.id, {
                role: selectedRole
            });
            onSuccess();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to update user role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>UPDATE ACCESS LEVEL</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.label}>TARGET USER</Text>
                        <Text style={styles.userName}>{user.name} ({user.email})</Text>

                        <Text style={styles.sectionLabel}>SELECT NEW ROLE</Text>
                        <View style={styles.roleList}>
                            {ROLES.map((role) => {
                                const isSelected = selectedRole === role.id;
                                return (
                                    <TouchableOpacity
                                        key={role.id}
                                        style={[
                                            styles.roleOption,
                                            isSelected && { borderColor: role.color, backgroundColor: `${role.color}10` }
                                        ]}
                                        onPress={() => setSelectedRole(role.id)}
                                    >
                                        <View style={[styles.radioCircle, isSelected && { borderColor: role.color }]}>
                                            {isSelected && <View style={[styles.radioFill, { backgroundColor: role.color }]} />}
                                        </View>
                                        <View>
                                            <Text style={[styles.roleLabel, isSelected && { color: role.color }]}>{role.label}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <Text style={styles.saveBtnText}>CONFIRM ASSIGNMENT</Text>
                                    <Check size={18} color="#000" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1E1E26',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2,
    },
    content: {
        gap: 16,
    },
    label: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        letterSpacing: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 10,
        color: '#C5A059',
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 8,
    },
    roleList: {
        gap: 10,
        marginBottom: 10,
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#16161D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 16,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#64748B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioFill: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    saveBtn: {
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    saveBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
});
