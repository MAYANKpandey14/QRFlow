
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../services/api';
import toast from 'react-hot-toast';

// --- QRs ---
export const useQRs = () => {
    return useQuery({
        queryKey: ['qrs'],
        queryFn: API.getQRs
    });
};

export const useCreateQR = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: API.createQR,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qrs'] });
            toast.success('QR Code created!');
        },
        onError: (err) => {
            toast.error('Failed to create QR');
            console.error(err);
        }
    });
};

export const useDeleteQR = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: API.deleteQR,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['qrs'] });
            toast.success('QR Code deleted');
        },
        onError: () => toast.error('Failed to delete QR')
    });
};

// --- Folders ---
export const useFolders = () => {
    return useQuery({
        queryKey: ['folders'],
        queryFn: API.getFolders
    });
};

export const useCreateFolder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ name, color }: { name: string, color: string }) => API.createFolder(name, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            toast.success('Folder created');
        }
    });
};

export const useDeleteFolder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: API.deleteFolder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            toast.success('Folder deleted');
        }
    });
};

// --- Short Links ---
export const useShortLinks = () => {
    return useQuery({
        queryKey: ['shortLinks'],
        queryFn: API.getShortLinks
    });
};

export const useCreateShortLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: API.createShortLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shortLinks'] });
            toast.success('Short link created!');
        },
        onError: (err) => {
            console.error(err);
            toast.error('Failed to create short link');
        }
    });
};

export const useDeleteShortLink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: API.deleteShortLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shortLinks'] });
            toast.success('Short link deleted');
        },
        onError: (err) => {
            console.error(err);
            toast.error('Failed to delete short link');
        }
    });
};

// --- Analytics ---
export const useAnalytics = (qrId?: string) => {
    return useQuery({
        queryKey: ['analytics', qrId],
        queryFn: () => API.getAnalytics(qrId)
    });
};
