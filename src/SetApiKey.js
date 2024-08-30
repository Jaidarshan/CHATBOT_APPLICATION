import React, { useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const SetApiKey = () => {
    const [apiKey, setApiKey] = useState('');
    const [message, setMessage] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const handleInputChange = (event) => {
        setApiKey(event.target.value);
    };

    const handleOpenModal = () => {
        setModalIsOpen(true);
    };

    const handleCloseModal = () => {
        setModalIsOpen(false);
        setMessage('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/set-api-key', { api_key: apiKey });
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response ? error.response.data.error : 'Error setting API key');
        }
    };

    return (
        <div>
            <button onClick={handleOpenModal} className="set-api-key">Set API Key</button>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={handleCloseModal}
                contentLabel="Set API Key"
                style={{
                    content: {
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '20px',
                        border: '1px solid #ccc',
                        borderRadius: '10px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    },
                }}
            >
                <h2>Enter API Key</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter API Key"
                        value={apiKey}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                    />
                    <button type="submit" className='button'>Submit</button>
                </form>
                {message && <p>{message}</p>}
                <button onClick={handleCloseModal} style={{ marginTop: '10px' }} className='button'>Close</button>
            </Modal>
        </div>
    );
};

export default SetApiKey;
