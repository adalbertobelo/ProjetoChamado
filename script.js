document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('ticketForm');
    const ticketsListDiv = document.getElementById('ticketsList');
    const defaultTicketsMessage = '<p>Nenhum chamado aberto no momento.</p>';
    const searchTicketIdInput = document.getElementById('searchTicketId');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    // Modal elements
    const manageTicketModal = document.getElementById('manageTicketModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTicketIdDisplay = document.getElementById('modalTicketIdDisplay');
    const modalClientName = document.getElementById('modalClientName');
    const modalClientAddress = document.getElementById('modalClientAddress');
    const modalTicketType = document.getElementById('modalTicketType');
    const modalTicketDescription = document.getElementById('modalTicketDescription');
    const modalFileName = document.getElementById('modalFileName');
    const modalFileSize = document.getElementById('modalFileSize');
    const modalCreatedAt = document.getElementById('modalCreatedAt');
    const modalTicketStatusSelect = document.getElementById('modalTicketStatus');
    const saveModalChangesBtn = document.getElementById('saveModalChangesBtn');
    let currentEditingTicketId = null;

    const statusOptions = ['Novo', 'Em Andamento', 'Finalizado', 'Cancelado'];

    let tickets = [];
    let nextTicketId = 1;

    loadData();

    ticketForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const clientName = document.getElementById('clientName').value;
        const clientAddress = document.getElementById('clientAddress').value;
        const ticketType = document.getElementById('ticketType').value;
        const ticketDescription = document.getElementById('ticketDescription').value;
        const fileInput = document.getElementById('fileUpload');
        const file = fileInput.files[0];

        const newTicket = {
            id: nextTicketId,
            clientName,
            clientAddress,
            ticketType,
            ticketDescription,
            fileName: file ? file.name : 'Nenhum arquivo anexado',
            fileSize: file ? (file.size / 1024).toFixed(2) + ' KB' : '',
            status: 'Novo', 
            createdAt: new Date().toLocaleString('pt-BR')
        };

        nextTicketId++;
        tickets.push(newTicket);
        saveData();
        renderTickets();
        ticketForm.reset();
        fileInput.value = '';
    });

    function renderTickets(filteredTickets = null) {
        const ticketsToRender = filteredTickets || tickets;

        if (ticketsToRender.length === 0 && !searchTicketIdInput.value) {
            ticketsListDiv.innerHTML = defaultTicketsMessage;
            return;
        }
        if (ticketsToRender.length === 0 && searchTicketIdInput.value) {
            ticketsListDiv.innerHTML = '<p>Nenhum chamado encontrado com este ID.</p>';
            return;
        }

        ticketsListDiv.innerHTML = ''; 

        const sortedTickets = [...ticketsToRender].sort((a, b) => b.id - a.id);

        sortedTickets.forEach(ticket => {
            const ticketElement = document.createElement('div');
            ticketElement.classList.add('ticket-item');
            ticketElement.dataset.ticketId = ticket.id; 

            let typeDisplay = ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1);

            ticketElement.innerHTML = `
                <h4>Chamado #${ticket.id} - ${typeDisplay}</h4>
                <p><strong>Cliente:</strong> ${ticket.clientName}</p>
                <p><strong>Endereço:</strong> ${ticket.clientAddress}</p>
                <p><strong>Descrição:</strong> ${ticket.ticketDescription}</p>
                <p><strong>Arquivo:</strong> ${ticket.fileName} ${ticket.fileSize ? `(${ticket.fileSize})` : ''}</p>
                <p><strong>Data de Abertura:</strong> ${ticket.createdAt}</p>
            `;

            const statusContainer = document.createElement('div');
            statusContainer.classList.add('ticket-status-container');
            const statusLabel = document.createElement('label');
            statusLabel.textContent = 'Status: ';
            statusLabel.htmlFor = `status-select-${ticket.id}`;
            const statusSelect = document.createElement('select');
            statusSelect.id = `status-select-${ticket.id}`;
            statusSelect.dataset.ticketId = ticket.id;
            statusSelect.classList.add('ticket-status-select');
            statusOptions.forEach(statusOption => {
                const option = document.createElement('option');
                option.value = statusOption;
                option.textContent = statusOption;
                if (ticket.status === statusOption) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            });
            statusContainer.appendChild(statusLabel);
            statusContainer.appendChild(statusSelect);
            ticketElement.appendChild(statusContainer);

            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('ticket-actions');
            const manageButton = document.createElement('button');
            manageButton.classList.add('manage-ticket-btn');
            manageButton.dataset.ticketId = ticket.id;
            manageButton.textContent = 'Gerenciar Chamado';
            actionsContainer.appendChild(manageButton);
            ticketElement.appendChild(actionsContainer);
            
            ticketsListDiv.appendChild(ticketElement);
        });
    }

    function saveData() {
        localStorage.setItem('jkTechTickets', JSON.stringify(tickets));
        localStorage.setItem('jkTechNextId', nextTicketId.toString());
    }
    
    function calculateNextIdBasedOnTickets() {
        if (tickets && tickets.length > 0) {
            const numericIds = tickets.map(t => t.id).filter(id => typeof id === 'number' && !isNaN(id));
            if (numericIds.length === 0) return 1;
            return Math.max(...numericIds, 0) + 1;
        }
        return 1;
    }

    function loadData() {
        const storedTickets = localStorage.getItem('jkTechTickets');
        const storedNextId = localStorage.getItem('jkTechNextId');

        if (storedTickets) {
            try {
                const parsedTickets = JSON.parse(storedTickets);
                if (Array.isArray(parsedTickets)) {
                    tickets = parsedTickets;
                } else {
                    tickets = [];
                }
            } catch (e) {
                console.error("Error parsing stored tickets:", e);
                tickets = [];
            }
        } else {
            tickets = [];
        }

        if (storedNextId) {
            const parsedId = parseInt(storedNextId, 10);
            if (!isNaN(parsedId) && parsedId > 0) {
                nextTicketId = parsedId;
            } else {
                nextTicketId = calculateNextIdBasedOnTickets();
            }
        } else {
            nextTicketId = calculateNextIdBasedOnTickets();
        }
        
        const minNextIdFromTickets = calculateNextIdBasedOnTickets();
        if (nextTicketId < minNextIdFromTickets) {
            nextTicketId = minNextIdFromTickets;
        }
        if(nextTicketId < 1) {
            nextTicketId = 1;
        }
        renderTickets();
    }

    // Search functionality
    searchTicketIdInput.addEventListener('input', () => {
        const searchTerm = searchTicketIdInput.value.trim();
        if (searchTerm) {
            const filtered = tickets.filter(ticket => ticket.id.toString().includes(searchTerm));
            renderTickets(filtered);
            clearSearchBtn.style.display = 'inline-block';
        } else {
            renderTickets();
            clearSearchBtn.style.display = 'none';
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchTicketIdInput.value = '';
        renderTickets();
        clearSearchBtn.style.display = 'none';
    });

    // Event delegation for status changes from inline select
    ticketsListDiv.addEventListener('change', (event) => {
        if (event.target.classList.contains('ticket-status-select')) {
            const ticketId = parseInt(event.target.dataset.ticketId, 10);
            const newStatus = event.target.value;
            const ticketToUpdate = tickets.find(t => t.id === ticketId);
            if (ticketToUpdate) {
                ticketToUpdate.status = newStatus;
                saveData();
            }
        }
    });

    // Event delegation for manage buttons (open modal)
    ticketsListDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('manage-ticket-btn')) {
            const ticketId = parseInt(event.target.dataset.ticketId, 10);
            openManageModal(ticketId);
        }
    });

    // Modal functions
    function openManageModal(ticketId) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        currentEditingTicketId = ticketId;

        modalTicketIdDisplay.textContent = ticket.id;
        modalClientName.textContent = ticket.clientName;
        modalClientAddress.textContent = ticket.clientAddress;
        modalTicketType.textContent = ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1);
        modalTicketDescription.textContent = ticket.ticketDescription;
        modalFileName.textContent = ticket.fileName;
        modalFileSize.textContent = ticket.fileSize ? `(${ticket.fileSize})` : '';
        modalCreatedAt.textContent = ticket.createdAt;

        modalTicketStatusSelect.innerHTML = ''; 
        statusOptions.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            if (ticket.status === status) {
                option.selected = true;
            }
            modalTicketStatusSelect.appendChild(option);
        });

        manageTicketModal.style.display = 'block';
    }

    function closeManageModal() {
        currentEditingTicketId = null;
        manageTicketModal.style.display = 'none';
    }

    closeModalBtn.addEventListener('click', closeManageModal);
    
    window.addEventListener('click', (event) => { 
        if (event.target === manageTicketModal) {
            closeManageModal();
        }
    });

    saveModalChangesBtn.addEventListener('click', () => {
        if (currentEditingTicketId === null) return;

        const ticketToUpdate = tickets.find(t => t.id === currentEditingTicketId);
        if (ticketToUpdate) {
            ticketToUpdate.status = modalTicketStatusSelect.value;
            saveData();
            renderTickets(searchTicketIdInput.value.trim() ? tickets.filter(ticket => ticket.id.toString().includes(searchTicketIdInput.value.trim())) : null); 
        }
        closeManageModal();
    });
});