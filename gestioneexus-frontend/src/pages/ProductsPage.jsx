import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/api';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import Pagination from '../components/Pagination'; // <-- 1. IMPORTAMOS EL COMPONENTE
import Swal from 'sweetalert2';

const ProductsPage = () => {
    const { searchTerm } = useOutletContext(); 
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // --- 2. AÑADIMOS ESTADOS PARA LA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reseteamos a la página 1 en cada nueva búsqueda
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // 3. Enviamos la página actual en la petición a la API
                const { data } = await api.get('/products', {
                    params: { 
                        search: debouncedSearchTerm,
                        page: currentPage 
                    }
                });
                // 4. Actualizamos los productos y los datos de paginación
                setProducts(data.products);
                setTotalPages(data.totalPages);
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'No se pudieron cargar los productos.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [debouncedSearchTerm, currentPage]); // Se ejecuta cuando cambia la búsqueda O la página actual

    const openModalForCreate = () => { setEditingProduct(null); setIsModalOpen(true); };
    const openModalForEdit = (product) => { setEditingProduct(product); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingProduct(null); };
    const handleProductAdded = (newProduct) => {
        // Al añadir, vamos a la primera página para ver el nuevo producto
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            setProducts(prev => [newProduct, ...prev]);
        }
    };
    const handleProductUpdated = (updatedProduct) => {
        setProducts(prev => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
    };
    const handleDelete = (productId) => {
        Swal.fire({
            title: '¿Estás seguro?', text: "El producto será desactivado.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#16A34A', cancelButtonColor: '#D33',
            confirmButtonText: 'Sí, ¡desactívalo!', cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/products/${productId}`);
                    Swal.fire('¡Desactivado!', 'El producto ha sido desactivado.', 'success');
                    // Refrescamos la lista actual para quitar el producto
                    setProducts(prev => prev.filter(p => p.id !== productId));
                } catch (error) {
                    Swal.fire('Error', 'No se pudo desactivar el producto.', 'error');
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
                <button 
                    onClick={openModalForCreate} 
                    className="bg-[#16A34A] text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                    + Agregar Producto
                </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
                {loading ? (
                    <div className="text-center py-8">Cargando productos...</div>
                ) : products.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Marca</th>
                                <th className="px-6 py-3">Categoría</th>
                                <th className="px-6 py-3">Tallas</th>
                                <th className="px-6 py-3">Referencia</th>
                                <th className="px-6 py-3 text-center">Cantidad</th>
                                <th className="px-6 py-3">Precio</th>
                                <th className="px-6 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{product.name}</th>
                                    <td className="px-6 py-4">{product.brand}</td>
                                    <td className="px-6 py-4">{product.category}</td>
                                    <td className="px-6 py-4">{product.sizes}</td>
                                    <td className="px-6 py-4">{product.reference}</td>
                                    <td className="px-6 py-4 text-center">{product.quantity}</td>
                                    <td className="px-6 py-4">${new Intl.NumberFormat('es-CO').format(product.price)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => openModalForEdit(product)} className="text-blue-600 hover:underline font-semibold">Editar</button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline font-semibold">Desactivar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No se encontraron productos {searchTerm && `para la búsqueda '${searchTerm}'`}.
                    </div>
                )}
                
                {/* --- 5. RENDERIZAMOS EL COMPONENTE DE PAGINACIÓN --- */}
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                title={editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            >
                <ProductForm 
                    onProductAdded={handleProductAdded}
                    onProductUpdated={handleProductUpdated}
                    closeModal={closeModal}
                    productToEdit={editingProduct}
                />
            </Modal>
        </div>
    );
};

export default ProductsPage;