import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Swal from 'sweetalert2';
import PasswordStrengthIndicator from './PasswordStrengthIndicator'; // Asumo que este componente existe, aunque no se use aquí

// --- CORRECCIÓN AQUÍ: Añadimos min="0" y step a los campos numéricos ---
const FormField = ({ label, name, type = 'text', value, onChange, required = false, disabled = false }) => (
    <div>
        <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
        <input 
            id={name} 
            type={type} 
            name={name} 
            value={value} 
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5D1227] disabled:bg-gray-200" 
            required={required} 
            disabled={disabled}
            min={type === 'number' ? '0' : undefined} // Añade min="0" solo a los inputs de tipo número
            step={name === 'quantity' ? '1' : '0.01'}   // Permite solo enteros para cantidad y decimales para precios/costos
        />
    </div>
);


const ProductForm = ({ onProductAdded, onProductUpdated, closeModal, productToEdit }) => {
    const [formData, setFormData] = useState({
        name: '', reference: '', category: '', sizes: '',
        brand: '', quantity: '', price: '', cost: ''
    });

    const isEditing = !!productToEdit;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: productToEdit.name,
                reference: productToEdit.reference || '',
                category: productToEdit.category || '',
                sizes: productToEdit.sizes || '',
                brand: productToEdit.brand || '',
                quantity: productToEdit.quantity,
                price: productToEdit.price,
                cost: productToEdit.cost || ''
            });
        } else {
            setFormData({
                name: '', reference: '', category: '', sizes: '',
                brand: '', quantity: '', price: '', cost: ''
            });
        }
    }, [productToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const { data: updatedProduct } = await api.put(`/products/${productToEdit.id}`, formData);
                Swal.fire('¡Éxito!', 'Producto actualizado correctamente.', 'success');
                onProductUpdated(updatedProduct);
            } else {
                const { data: newProduct } = await api.post('/products', formData);
                Swal.fire('¡Éxito!', 'Producto agregado correctamente.', 'success');
                onProductAdded(newProduct);
            }
            closeModal();
        } catch (error) {
            const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.msg || 'Ocurrió un error.';
            Swal.fire('Error', errorMsg, 'error');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nombre del Producto" name="name" value={formData.name} onChange={handleChange} required />
                <FormField label="Marca" name="brand" value={formData.brand} onChange={handleChange} />
                <FormField label="Referencia" name="reference" value={formData.reference} onChange={handleChange} />
                <div>
                    <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">Categoría</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5D1227]"
                    >
                        <option value="">Seleccione una categoría</option>
                        <option value="Hombres">Hombres</option>
                        <option value="Mujeres">Mujeres</option>
                        <option value="Niños">Niños</option>
                        <option value="Niñas">Niñas</option>
                        <option value="Unisex">Unisex</option>
                    </select>
                </div>
                <FormField label="Tallas (ej. S,M,L)" name="sizes" value={formData.sizes} onChange={handleChange} />
                <FormField label="Cantidad" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                <FormField label="Precio (Venta)" name="price" type="number" value={formData.price} onChange={handleChange} required />
                <FormField label="Costo (Compra)" name="cost" type="number" value={formData.cost} onChange={handleChange} required />
            </div>
            <div className="flex justify-end pt-4 border-t mt-6">
                <button type="button" onClick={closeModal} className="mr-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-green-700 font-semibold">
                    {isEditing ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;