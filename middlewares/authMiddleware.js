import jwt from "jsonwebtoken";

export const protect = (req,res,next)=>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer")){
            return res.status(401).json({message:"Not authorized"});
        }
        const token = authHeader.split(" ")[1];
        const decode = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decode;
        next();
    }catch(error){
        res.status(401).json({message:"Not authorized"});
    }
};

export const adminOnly = (req,res,next)=>{
    if(req.user.role !== 'ADMIN'){
        return res.status(403).json({message:"Access denied"});
    }
    next();
};

export const studentOnly = (req,res,next)=>{
    if(req.user.role !== 'STUDENT'){
        return res.status(403).json({message:"Access denied"});
    }
    next();
};
