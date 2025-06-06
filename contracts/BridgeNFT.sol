// SPDX-License-Identifier: No License (None)
pragma solidity ^0.8.0;

/*
interface IERC721Cloned {
    function initialize(
        string memory name_,    // NFT collection name
        string memory symbol_,  // NFT collection symbol
        string memory baseURI_, // baseURI (from origin NFT contract)
        address origin_,        // Address of origin NFT contract
        uint256 chainID_        // Chain ID where origin NFT contract located
    ) external;
    function mint(address to, uint256 tokenID) external;
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}
*/
interface IHybridNFTCloned {
    function initialize(
        string memory name_,    // NFT collection name
        string memory symbol_,  // NFT collection symbol
        string memory baseURI_, // baseURI (from origin NFT contract)
        address feeReceiver_,   // fee receiver (from origin NFT contract)
        uint256 defaultFee_,    // default fee (from origin NFT contract)
        address origin_,        // Address of origin NFT contract
        uint256 chainID_        // Chain ID where origin NFT contract located
    ) external;
    function mint(address to, uint256 tokenID) external;
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
 * deploying minimal proxy contracts, also known as "clones".
 *
 * > To simply and cheaply clone contract functionality in an immutable way, this standard specifies
 * > a minimal bytecode implementation that delegates all calls to a known, fixed address.
 *
 * The library includes functions to deploy a proxy using either `create` (traditional deployment) or `create2`
 * (salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
 * deterministic method.
 *
 * _Available since v3.4._
 */
library Clones {
    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address implementation) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address implementation, bytes32 salt) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create2(0, ptr, 0x37, salt)
        }
        require(instance != address(0), "ERC1167: create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf3ff00000000000000000000000000000000)
            mstore(add(ptr, 0x38), shl(0x60, deployer))
            mstore(add(ptr, 0x4c), salt)
            mstore(add(ptr, 0x6c), keccak256(ptr, 0x37))
            predicted := keccak256(add(ptr, 0x37), 0x55)
        }
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(address implementation, bytes32 salt)
        internal
        view
        returns (address predicted)
    {
        return predictDeterministicAddress(implementation, salt, address(this));
    }
}


/**
 * @dev Library for managing
 * https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
 * types.
 *
 * Sets have the following properties:
 *
 * - Elements are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Elements are enumerated in O(n). No guarantees are made on the ordering.
 *
 * ```
 * contract Example {
 *     // Add the library methods
 *     using EnumerableSet for EnumerableSet.AddressSet;
 *
 *     // Declare a set state variable
 *     EnumerableSet.AddressSet private mySet;
 * }
 * ```
 *
 * As of v3.0.0, only sets of type `address` (`AddressSet`) and `uint256`
 * (`UintSet`) are supported.
 */
library EnumerableSet {

    struct AddressSet {
        // Storage of set values
        address[] _values;

        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping (address => uint256) _indexes;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(AddressSet storage set, address value) internal returns (bool) {
        if (!contains(set, value)) {
            set._values.push(value);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set._indexes[value] = set._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(AddressSet storage set, address value) internal returns (bool) {
        // We read and store the value's index to prevent multiple reads from the same storage slot
        uint256 valueIndex = set._indexes[value];

        if (valueIndex != 0) { // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 toDeleteIndex = valueIndex - 1;
            uint256 lastIndex = set._values.length - 1;

            // When the value to delete is the last one, the swap operation is unnecessary. However, since this occurs
            // so rarely, we still do the swap anyway to avoid the gas cost of adding an 'if' statement.

            address lastvalue = set._values[lastIndex];

            // Move the last value to the index where the value to delete is
            set._values[toDeleteIndex] = lastvalue;
            // Update the index for the moved value
            set._indexes[lastvalue] = toDeleteIndex + 1; // All indexes are 1-based

            // Delete the slot where the moved value was stored
            set._values.pop();

            // Delete the index for the deleted slot
            delete set._indexes[value];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(AddressSet storage set, address value) internal view returns (bool) {
        return set._indexes[value] != 0;
    }

    /**
     * @dev Returns 1-based index of value in the set. O(1).
     */
    function indexOf(AddressSet storage set, address value) internal view returns (uint256) {
        return set._indexes[value];
    }


    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(AddressSet storage set) internal view returns (uint256) {
        return set._values.length;
    }

   /**
    * @dev Returns the value stored at position `index` in the set. O(1).
    *
    * Note that there are no guarantees on the ordering of values inside the
    * array, and it may change when more values are added or removed.
    *
    * Requirements:
    *
    * - `index` must be strictly less than {length}.
    */
    function at(AddressSet storage set, uint256 index) internal view returns (address) {
        require(set._values.length > index, "EnumerableSet: index out of bounds");
        return set._values[index];
    }
}

abstract contract Ownable {
    address internal _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    /* will use initialize instead
    constructor () {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    */
    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

}

contract CallistoNFTBridge is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet authorities; // authority has to sign claim transaction (message)

    struct Token {
        address token;  // foreign token address
        bool isWrapped; // is native token wrapped of foreign
    }

    struct Upgrade {
        address newContract;
        uint64  validFrom;
    }

    Upgrade public upgradeData;
    uint256 public setupMode;   // time when setup mode will start, 0 if disable
    address public founders;
    address public requiredAuthority;   // authority address that MUST sign swap transaction
    uint256 public threshold;   // minimum number of signatures required to approve swap
    //address public ERC721Implementation;    // implementation of wrapped token
    address public HybridNFTImplementation;    // implementation of wrapped token
    address public feeTo; // send fee to this address
    bool public frozen; // if frozen - swap will not work

    uint256 public wrapNonce;   // the last nonce used to create wrapped token address begin with 0xCC.... 
    mapping(uint256 => mapping(bytes32 => bool)) public isTxProcessed;    // chainID => txID => isProcessed
    mapping(uint256 => mapping(address => Token)) public tokenPair;       // chainID => native token address => foreign Token struct
    mapping(uint256 => mapping(address => address)) public tokenForeign;  // chainID => foreign token address => native token
    //mapping(address => uint256) public tokenDeposits;  // amount of tokens were deposited by users
    mapping(address => bool) public isFreezer;  // addresses that have right to freeze contract 

    event SetAuthority(address authority, bool isEnable);
    event SetFeeTo(address previousFeeTo, address newFeeTo);
    event SetThreshold(uint256 threshold);
    event Deposit(address indexed token, address indexed sender, uint256 tokenId, uint256 toChainId, address toToken);
    event Claim(address indexed token, address indexed to, uint256 value, bytes32 txId, uint256 fromChainId, address fromToken);
    event Fee(address indexed sender, uint256 fee);
    event CreatePair(address toToken, bool isWrapped, address fromToken, uint256 fromChainId);
    event Frozen(bool status);
    event RescuedERC20(address token, address to, uint256 value);
    event SetFreezer(address freezer, bool isActive);
    event SetupMode(uint time);
    event UpgradeRequest(address newContract, uint256 validFrom);

    // run only once from proxy
    function initialize(address newOwner, address newFounders, address _HybridNFTImplementation) external {
        require(newOwner != address(0) && newFounders != address(0) && founders == address(0)); // run only once
        _owner = newOwner;
        founders = newFounders;
        emit OwnershipTransferred(address(0), msg.sender);
        require(_HybridNFTImplementation != address(0), "Wrong Implementation");
        //ERC721Implementation = _ERC721Implementation;
        HybridNFTImplementation = _HybridNFTImplementation;
        feeTo = msg.sender;
        threshold = 1;
        setupMode = 1; // allow setup after deployment
    }
    /*
    constructor (address _tokenImplementation) {
        require(_tokenImplementation != address(0), "Wrong tokenImplementation");
        tokenImplementation = _tokenImplementation;
        feeTo = msg.sender;
        threshold = 1;
    }
    */
    modifier notFrozen() {
        require(!frozen, "Bridge is frozen");
        _;
    }

    // allowed only in setup mode
    modifier onlySetup() {
        {
        uint256 mode = setupMode; //use local variable to save gas
        require(mode != 0 && mode < block.timestamp, "Not in setup mode");
        }
        _;
    }

    function upgradeTo() external view returns(address newContract) {
        Upgrade memory upg = upgradeData;
        require(upg.validFrom < block.timestamp && upg.newContract != address(0), "Upgrade not allowed");
        newContract = upg.newContract;
    }

    function requestUpgrade(address newContract) external onlyOwner {
        require(newContract != address(0), "Zero address");
        uint256 validFrom = block.timestamp;// + 3 days;    // allow upgrade after 3 days
        upgradeData = Upgrade(newContract, uint64(validFrom));
        emit UpgradeRequest(newContract, validFrom);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */

    function transferOwnership(address newOwner) public {
        require(founders == msg.sender || _owner == msg.sender, "Ownable: caller is not the founders");
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function ChangeFounder(address newFounders) public {
        require(founders == msg.sender, "caller is not the founders");
        require(newFounders != address(0), "new owner is the zero address");
        emit OwnershipTransferred(founders, newFounders);
        founders = newFounders;
    }

    // get number of authorities
    function getAuthoritiesNumber() external view returns(uint256) {
        return authorities.length();
    }

    // returns list of authorities addresses
    function getAuthorities() external view returns(address[] memory) {
        return authorities._values;
    }

    // Owner or Authority may freeze bridge in case of anomaly detection
    function freeze() external {
        require(msg.sender == owner() || authorities.contains(msg.sender) || isFreezer[msg.sender]);
        frozen = true;
        emit Frozen(true);
    }

    // Only owner can manually unfreeze contract
    function unfreeze() external onlyOwner onlySetup {
        frozen = false;
        emit Frozen(false);
    }

    // add authority
    function setFreezer(address freezer, bool isActive) external onlyOwner {
        require(freezer != address(0), "Zero address");
        isFreezer[freezer] = isActive;
        emit SetFreezer(freezer, isActive);
    }

    // add authority
    function addAuthority(address authority) external onlyOwner onlySetup {
        require(authority != address(0), "Zero address");
        require(authorities.length() < 255, "Too many authorities");
        require(authorities.add(authority), "Authority already added");
        emit SetAuthority(authority, true);
    }

    // remove authority
    function removeAuthority(address authority) external onlyOwner {
        require(authorities.remove(authority), "Authority does not exist");
        emit SetAuthority(authority, false);
    }

    // set authority address that MUST sign claim request
    function setRequiredAuthority(address authority) external onlyOwner onlySetup {
        requiredAuthority = authority;
    }

    // set fee receiver address
    function setFeeTo(address newFeeTo) external onlyOwner onlySetup {
        require(newFeeTo != address(0), "Zero address");
        address previousFeeTo = feeTo;
        feeTo = newFeeTo;
        emit SetFeeTo(previousFeeTo, newFeeTo);
    }

    // set threshold - minimum number of signatures required to approve swap
    function setThreshold(uint256 _threshold) external onlyOwner onlySetup {
        require(_threshold != 0 && _threshold <= authorities.length(), "Wrong threshold");
        threshold = _threshold;
        emit SetThreshold(threshold);
    }

    function disableSetupMode() external onlyOwner {
        setupMode = 0;
        emit SetupMode(0);
    }

    function enableSetupMode() external onlyOwner {
        setupMode = block.timestamp + 1 days;
        emit SetupMode(setupMode);
    }

    // returns `nonce` to use in `createWrappedToken()` to create address starting with 0xCC.....
    function calculateNonce(uint256 startNonce) external view returns(uint256 nonce, address addr) {
        if (startNonce == 0)
            nonce = wrapNonce;
        else 
            nonce = startNonce;
        address implementation = HybridNFTImplementation;
        while (true) {
            nonce++;
            addr = Clones.predictDeterministicAddress(implementation, bytes32(nonce));
            if (uint160(addr) & uint160(0xfF00000000000000000000000000000000000000) == uint160(0xCc00000000000000000000000000000000000000))
                break;
        }
    }


    function safeTransfer(address token, address to, uint value) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
    }

    function safeTransferETH(address to, uint value) internal {
        (bool success,) = to.call{value:value}(new bytes(0));
        require(success, 'TransferHelper: ETH_TRANSFER_FAILED');
    }

    function rescueERC20(address token, address to) external onlyOwner {
        uint256 value = IERC20(token).balanceOf(address(this));
        safeTransfer(token, to, value);
        emit RescuedERC20(token, to, value);
    }
/*
    // Create wrapped ERC721 token for foreign token
    function createWrappedERC721(
        address fromToken,      // foreign token address
        uint256 fromChainId,    // foreign chain ID where token deployed
        string memory name,     // wrapped token name
        string memory symbol,   // wrapped token symbol
        string memory baseURI,  // baseURI (from origin NFT contract)
        uint256 nonce           // nonce to create wrapped token address begin with 0xCC.... 
    )
        external
        onlyOwner
        onlySetup
    {
        require(fromToken != address(0), "Wrong token address");
        require(tokenForeign[fromChainId][fromToken] == address(0), "This token already wrapped");
        address wrappedToken = Clones.cloneDeterministic(ERC721Implementation, bytes32(nonce));
        IERC721Cloned(wrappedToken).initialize(name, symbol, baseURI, fromToken, fromChainId);

        tokenPair[fromChainId][wrappedToken] = Token(fromToken, address(0));
        tokenForeign[fromChainId][fromToken] = wrappedToken;
        emit CreateWrappedToken(wrappedToken, false, fromToken, fromChainId); //wrappedToken - wrapped token contract address
    }
*/
    // Create wrapped Hybrid token for foreign token
    function createWrappedHybrid(
        address fromToken,      // foreign token address
        uint256 fromChainId,    // foreign chain ID where token deployed
        string memory name,     // wrapped token name
        string memory symbol,   // wrapped token symbol
        string memory baseURI,  // baseURI (from origin NFT contract)
        address feeReceiver,    // fee receiver (from origin NFT contract or address(0))
        uint256 defaultFee,     // default fee (from origin NFT contract or 0)
        uint256 nonce           // nonce to create wrapped token address begin with 0xCC.... 
    )
        external
        onlyOwner
        onlySetup
    {
        require(fromToken != address(0), "Wrong token address");
        require(tokenForeign[fromChainId][fromToken] == address(0), "This token already wrapped");
        /*{
        require(nonce > wrapNonce, "Nonce must be higher then wrapNonce");
        wrapNonce = nonce;
        }*/
        address wrappedToken = Clones.cloneDeterministic(HybridNFTImplementation, bytes32(nonce));
        IHybridNFTCloned(wrappedToken).initialize(name, symbol, baseURI, feeReceiver, defaultFee, fromToken, fromChainId);

        tokenPair[fromChainId][wrappedToken] = Token(fromToken, true);
        tokenForeign[fromChainId][fromToken] = wrappedToken;
        emit CreatePair(wrappedToken, true, fromToken, fromChainId); //wrappedToken - wrapped token contract address
    }

    /**
     * @dev Create pair between existing tokens on native and foreign chains
     * @param toToken token address on native chain
     * @param fromToken wrapped token address on foreign chain (hybrid or erc721)
     * @param fromChainId foreign chain ID
     * @param isWrapped `true` if `toToken` is our wrapped token otherwise `false`
     */
    function createPair(address toToken, address fromToken, uint256 fromChainId, bool isWrapped) external onlyOwner onlySetup {
        require(tokenPair[fromChainId][toToken].token == address(0), "Pair already exist");
        tokenPair[fromChainId][toToken] = Token(fromToken, isWrapped);
        tokenForeign[fromChainId][fromToken] = toToken;
        emit CreatePair(toToken, isWrapped, fromToken, fromChainId);
    }

    /**
     * @dev Delete unused pair
     * @param toToken token address on native chain
     * @param fromChainId foreign chain ID
     */
    function deletePair(address toToken, uint256 fromChainId) external onlyOwner onlySetup {
        address fromToken = tokenPair[fromChainId][toToken].token;
        delete tokenPair[fromChainId][toToken];
        delete tokenForeign[fromChainId][fromToken];
    }

    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes calldata _data) external returns(bytes4) {
        if (_data.length == 64) {    // allow to swap using `safeTransferFrom` with ABI encoded `receiver` and `toChainId` into `_data`
            address token = msg.sender;
            (
            address receiver,   // address of token receiver on destination chain
            uint256 toChainId   // destination chain Id where will be claimed tokens
            ) = abi.decode(_data, (address, uint256));
            require(receiver != address(0), "Incorrect receiver address");
            address pair_token = tokenPair[toChainId][token].token;
            require(pair_token != address(0), "There is no pair");

            emit Deposit(token, receiver, _tokenId, toChainId, pair_token);
        } else {
            require(_operator == address(this), "Only bridge operator");
        }
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    function depositNFT(
        address receiver,   // address of token receiver on destination chain
        address token,      // NFT token that user send
        uint256 tokenId,    // token ID
        uint256 toChainId   // destination chain Id where will be claimed tokens
    ) 
        external
        payable
        notFrozen
    {
        require(receiver != address(0), "Incorrect receiver address");
        address pair_token = _deposit(token, tokenId, toChainId);
        emit Deposit(token, receiver, tokenId, toChainId, pair_token);
    }
    
    function depositNFT(
        address token,      // NFT token that user send
        uint256 tokenId,    // token ID
        uint256 toChainId   // destination chain Id where will be claimed tokens
    ) 
        external
        payable
        notFrozen
    {
        address pair_token = _deposit(token, tokenId, toChainId);
        emit Deposit(token, msg.sender, tokenId, toChainId, pair_token);
    }
    
    function _deposit(
        address token,      // token that user send (if token address < 32, then send native coin)
        uint256 tokenId,      // tokens value
        uint256 toChainId   // destination chain Id where will be claimed tokens
    ) 
        internal 
        returns (address pair_token) 
    {
        pair_token = tokenPair[toChainId][token].token;
        require(pair_token != address(0), "There is no pair");

        IHybridNFTCloned(token).safeTransferFrom(msg.sender, address(this), tokenId);

        if (msg.value != 0) {
            safeTransferETH(feeTo, msg.value);
            emit Fee(msg.sender, msg.value);
        }
    }

    // claim
    function claim(
        address token,          // NFT token contract address to receive
        bytes32 txId,           // deposit transaction hash on fromChain 
        address to,             // user address
        uint256 tokenId,        // NFT token ID
        uint256 fromChainId,    // chain ID where user deposited
        bytes[] memory sig      // authority signatures
    ) 
        external
        notFrozen
    {
        require(!isTxProcessed[fromChainId][txId], "Transaction already processed");
        Token memory pair = tokenPair[fromChainId][token];
        require(pair.token != address(0), "There is no pair");
        isTxProcessed[fromChainId][txId] = true;
        address must = requiredAuthority;
        bytes32 messageHash = keccak256(abi.encodePacked(token, to, tokenId, txId, fromChainId, block.chainid, address(this)));
        messageHash = prefixed(messageHash);
        uint256 uniqSig;
        uint256 set;    // maximum number of authorities is 255
        for (uint i = 0; i < sig.length; i++) {
            address authority = recoverSigner(messageHash, sig[i]);
            if (authority == must) must = address(0);
            uint256 index = authorities.indexOf(authority);
            uint256 mask = 1 << index;
            if (index != 0 && (set & mask) == 0 ) {
                set |= mask;
                uniqSig++;
            }
        }
        require(threshold <= uniqSig, "Require more signatures");
        require(must == address(0), "The required authority does not sign");

            if(pair.isWrapped) {
                IHybridNFTCloned(token).mint(to, tokenId);
            } else {
                IHybridNFTCloned(token).safeTransferFrom(address(this), to, tokenId);
            }
        emit Claim(token, to, tokenId, txId, fromChainId, pair.token);
    }

    // Signature methods

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function isContract(address account) internal view returns (bool) {
        // This method relies in extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}